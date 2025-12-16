// controllers/staff.controller.ts

import type { Request, Response } from 'express';
import { Staff } from '../models/staff.model';
import { User } from '../models/user.model';
import type { IStaff } from '../models/staff.model';
import type { FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import { Gym } from '../models/gym.model';
import { generateSecurePassword } from '../utils/password.util';
import { sendStaffWelcomeEmail, sendAdminStaffCopyEmail } from '../utils/emailSender';
import { getVisibleStaffIds } from '../utils/staffPermissions.util';

/**
 * Create a new staff member with automatic User account creation
 * This creates both a User record (for authentication) and a Staff record (for staff details)
 * Implements ATOMIC behavior: If staff creation fails, the user account is deleted.
 */
export const createStaff = async (req: Request, res: Response): Promise<void> => {
  let createdUserId: string | null = null;

  try {
    // Get admin user info from auth middleware
    const user = (req as any).user;
    const adminUserId = user?.id;
    const adminGymId = user?.gym;

    if (!adminUserId || !adminGymId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated or gym not found',
      });
      return;
    }

    // Determine Owner ID (Admin)
    let ownerId = adminUserId;
    if (user.role === 'staff' && user.position === 'manager') {
      // Find the admin who created this manager
      const managerStaff = await Staff.findOne({ userId: adminUserId });
      if (managerStaff && managerStaff.createdBy) {
        ownerId = managerStaff.createdBy.toString();
      }
    }

    const { fullName, email, position, contactNumber, joiningDate, salary, status, notifications } = req.body;

    // --- 1. STRICT VALIDATION (Before any DB writes) ---

    // Check if email exists in User collection (Global Uniqueness for Login)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'A user with this email already exists (Global User Account)',
      });
      return;
    }

    // Check if email exists in Staff collection (Scoped to Admin)
    const existingStaffEmail = await Staff.findOne({
      email: email.toLowerCase(),
      createdBy: ownerId
    });

    if (existingStaffEmail) {
      res.status(400).json({
        success: false,
        message: 'A staff member with this email already exists for this admin',
      });
      return;
    }

    // Check if phone exists in Staff collection (Scoped to Admin)
    if (contactNumber) {
      // Note: We intentionally DO NOT check User collection for phone uniqueness
      // to allow different admins to create staff with same phone number.

      const existingStaffPhone = await Staff.findOne({
        contactNumber,
        createdBy: ownerId
      });

      if (existingStaffPhone) {
        res.status(400).json({
          success: false,
          message: 'A staff member with this phone number already exists for this admin',
        });
        return;
      }
    }

    // --- 2. CREATE USER ---
    const generatedPassword = generateSecurePassword(12);

    const newUser = new User({
      fullname: fullName,
      email: email.toLowerCase(),
      phone: contactNumber,
      password: generatedPassword, // Will be hashed by pre-save hook
      role: 'staff',
      gym: adminGymId,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=ea580c&color=fff`,
    });

    const savedUser = await newUser.save();
    createdUserId = savedUser._id.toString(); // Track ID for rollback
    console.log('✅ User account created:', createdUserId);

    // --- 3. CREATE STAFF (Atomic Step) ---
    try {
      const newStaff = new Staff({
        userId: savedUser._id,
        createdBy: ownerId, // Set to Admin ID even if Manager creates it
        gym: adminGymId,
        fullName,
        email: email.toLowerCase(),
        position,
        contactNumber,
        joiningDate,
        salary,
        status: status || 'active',
        notifications: notifications || {
          sms: true,
          email: true,
          push: true,
          whatsapp: true,
        },
      });

      const savedStaff = await newStaff.save();
      console.log('✅ Staff record created:', savedStaff._id);

      // --- Fetch Gym Details for Email ---
      let gymName = 'SoActiv Gym';
      if (adminGymId) {
        try {
          const gymDoc = await Gym.findById(adminGymId);
          if (gymDoc) {
            gymName = gymDoc.name;
          }
        } catch (gymErr) {
          console.error('⚠️ Could not fetch gym name for email:', gymErr);
        }
      }

      // --- 4. SEND EMAIL (Non-blocking) ---
      const emailResult = await sendStaffWelcomeEmail(
        email.toLowerCase(),
        fullName,
        generatedPassword,
        gymName
      );

      if (!emailResult.success) {
        console.warn('⚠️ Email sending failed:', emailResult.error);
      } else {
        console.log('✅ Welcome email sent:', emailResult.messageId);
      }

      // --- 5. SEND ADMIN COPY (Non-blocking) ---
      // Send a copy to the admin who created the staff
      if (user.email) {
        const adminEmailResult = await sendAdminStaffCopyEmail(
          user.email,
          fullName,
          email.toLowerCase(),
          generatedPassword,
          gymName
        );
        if (adminEmailResult.success) {
          console.log('✅ Admin copy email sent to:', user.email);
        }
      }

      // --- 6. SUCCESS RESPONSE ---
      res.status(201).json({
        success: true,
        message: 'Staff account created successfully',
        data: {
          staff: savedStaff,
          user: {
            id: savedUser._id,
            email: savedUser.email,
            fullname: savedUser.fullname,
            role: savedUser.role,
          },
          emailSent: emailResult.success,
        },
      });

    } catch (staffError: any) {
      console.error('❌ Error creating staff record. Rolling back user creation...', staffError);

      // --- ROLLBACK: Delete the user we just created ---
      if (createdUserId) {
        await User.findByIdAndDelete(createdUserId);
        console.log('✅ Rollback successful: User deleted.');
      }

      // Re-throw or handle specific errors
      if (staffError.code === 11000) {
        // Check which field caused the duplicate error
        const field = Object.keys(staffError.keyPattern || {})[0];
        const message = field === 'email'
          ? 'Email already exists (Global constraint)'
          : 'Phone number already exists (Global constraint)';

        res.status(400).json({
          success: false,
          message: `Duplicate key error: ${message}. Please ensure unique values.`,
          error: staffError.message
        });
        return;
      }

      throw staffError; // Pass to outer catch
    }

  } catch (error: any) {
    console.error('❌ Error in createStaff transaction:', error);

    // Final safety net: if createdUserId exists but we are here, ensure it's gone
    if (createdUserId) {
      const orphan = await User.findById(createdUserId);
      if (orphan) {
        await User.findByIdAndDelete(createdUserId);
        console.log('✅ Safety Rollback: Orphan user deleted.');
      }
    }

    res.status(500).json({
      success: false,
      message: 'Staff creation failed',
      error: error.message,
    });
  }
};

/**
 * Get all staff members (only for the logged-in user's gym/visibility)
 */
export const getAllStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const gymId = user?.gym;

    if (!userId || !gymId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Use permission utility to get allowed staff IDs
    const visibleStaffIds = await getVisibleStaffIds(
      new Types.ObjectId(userId),
      user.role,
      user.position
    );

    const { search, role, status } = req.query;

    const query: FilterQuery<IStaff> = {
      _id: { $in: visibleStaffIds }
    };

    if (search || role || status) {
      if (search) {
        query.$or = [
          { fullName: { $regex: search as string, $options: 'i' } },
          { email: { $regex: search as string, $options: 'i' } },
          { contactNumber: { $regex: search as string, $options: 'i' } },
          { position: { $regex: search as string, $options: 'i' } },
        ];
      }
      if (role) {
        query.position = { $regex: new RegExp(role as string, 'i') };
      }
      if (status === 'active' || status === 'inactive') {
        query.status = status;
      }
    }

    console.log('🔍 Final Query:', query);

    const staff = await Staff.find(query).sort({ createdAt: -1 });

    console.log(`✅ Found ${staff.length} staff members`);

    res.json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (error: any) {
    console.error('🚨 Error in getAllStaff:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching staff',
      error: error.message,
    });
  }
};

/**
 * Get a single staff member by ID (visible only)
 */
export const getStaffById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Check visibility
    const visibleStaffIds = await getVisibleStaffIds(
      new Types.ObjectId(userId),
      user.role,
      user.position
    );

    const isAllowed = visibleStaffIds.some(sid => sid.equals(id));

    if (!isAllowed) {
      res.status(404).json({
        success: false,
        message: 'Staff not found or access denied',
      });
      return;
    }

    const staff = await Staff.findById(id);

    res.json({
      success: true,
      data: staff,
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid staff ID format',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Update a staff member by ID (visible only)
 */
export const updateStaffById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Determine Owner ID (Admin)
    let ownerId = userId;
    if (user.role === 'staff' && user.position === 'manager') {
      const managerStaff = await Staff.findOne({ userId: userId });
      if (managerStaff && managerStaff.createdBy) {
        ownerId = managerStaff.createdBy.toString();
      }
    }

    // Check visibility
    const visibleStaffIds = await getVisibleStaffIds(
      new Types.ObjectId(userId),
      user.role,
      user.position
    );

    const isAllowed = visibleStaffIds.some(sid => sid.equals(id));

    if (!isAllowed) {
      res.status(404).json({
        success: false,
        message: 'Staff not found or access denied',
      });
      return;
    }

    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.userId;
    delete updates.gym;
    // delete updates.email; // Allow email update if needed, but validate it

    // Validate Email Uniqueness (Scoped)
    if (updates.email) {
      const existingStaffEmail = await Staff.findOne({
        email: updates.email.toLowerCase(),
        createdBy: ownerId,
        _id: { $ne: id } // Exclude current staff
      });

      if (existingStaffEmail) {
        res.status(400).json({
          success: false,
          message: 'A staff member with this email already exists for this admin',
        });
        return;
      }
    }

    // Validate Phone Uniqueness (Scoped)
    if (updates.contactNumber) {
      const existingStaffPhone = await Staff.findOne({
        contactNumber: updates.contactNumber,
        createdBy: ownerId,
        _id: { $ne: id } // Exclude current staff
      });

      if (existingStaffPhone) {
        res.status(400).json({
          success: false,
          message: 'A staff member with this phone number already exists for this admin',
        });
        return;
      }
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedStaff) {
      res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
      return;
    }

    // Sync updates to User model
    if (updatedStaff.userId) {
      const userUpdates: any = {};

      if (updates.fullName) {
        userUpdates.fullname = updates.fullName;
        userUpdates.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(updates.fullName)}&background=ea580c&color=fff`;
      }

      if (updates.contactNumber) {
        userUpdates.phone = updates.contactNumber;
      }

      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(updatedStaff.userId, userUpdates);
        console.log('✅ Synced updates to User account');
      }
    }

    res.json({
      success: true,
      data: updatedStaff,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      // Check which field caused the duplicate error
      const field = Object.keys(error.keyPattern || {})[0];
      const message = field === 'email'
        ? 'Email already exists (Global constraint)'
        : 'Phone number already exists (Global constraint)';

      res.status(400).json({
        success: false,
        message: `Duplicate key error: ${message}. Please ensure unique values.`,
      });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error during update',
      error: error.message,
    });
  }
};

/**
 * Delete a staff member by ID (visible only)
 * Also deletes the associated User account
 */
export const deleteStaffById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    // Check visibility
    const visibleStaffIds = await getVisibleStaffIds(
      new Types.ObjectId(userId),
      user.role,
      user.position
    );

    const isAllowed = visibleStaffIds.some(sid => sid.equals(id));

    if (!isAllowed) {
      res.status(404).json({
        success: false,
        message: 'Staff not found or access denied',
      });
      return;
    }

    const deletedStaff = await Staff.findByIdAndDelete(id);

    if (!deletedStaff) {
      res.status(404).json({
        success: false,
        message: 'Staff not found',
      });
      return;
    }

    // Also delete the associated User account
    if (deletedStaff.userId) {
      await User.findByIdAndDelete(deletedStaff.userId);
      console.log('✅ Associated user account deleted');
    }

    res.json({
      success: true,
      message: 'Staff and associated user account deleted successfully',
      deletedStaff,
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid staff ID format',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error during deletion',
      error: error.message,
    });
  }
};

/**
 * Update the logged-in staff's profile (Avatar, Password, Details)
 */
export const updateStaffProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { fullName, phone, currentPassword, newPassword } = req.body;
    const avatarFile = req.file; // From multer

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // 1. Password Update
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
        return;
      }

      // Verify current password
      const isMatch = await userDoc.isPasswordCorrect(currentPassword);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Incorrect current password' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        return;
      }

      userDoc.password = newPassword; // Will be hashed by pre-save
    }

    // 2. Avatar Update
    if (avatarFile) {
      // Construct URL - assuming served statically from /uploads
      const baseUrl = process.env.API_URL || 'http://localhost:8000';
      const avatarUrl = `${baseUrl}/uploads/${avatarFile.filename}`;
      userDoc.avatar = avatarUrl;
    }

    // 3. Update Basic Details
    let dataChanged = false;
    if (fullName && fullName !== userDoc.fullname) {
      userDoc.fullname = fullName;
      dataChanged = true;
    }
    if (phone && phone !== userDoc.phone) {
      userDoc.phone = phone;
      dataChanged = true;
    }

    // Save User
    await userDoc.save();

    // 4. Sync with Staff Record
    const staffDoc = await Staff.findOne({ userId: userId });
    if (staffDoc) {
      if (fullName) staffDoc.fullName = fullName;
      if (phone) staffDoc.contactNumber = phone;

      // If user uploaded new avatar, sync it.
      // If user didn't upload but name changed, we might want to update ui-avatar if they were using one,
      // but simpler to just sync if explicit avatar on userDoc.
      if (userDoc.avatar) {
        staffDoc.avatar = userDoc.avatar;
      }

      await staffDoc.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userDoc.toFrontendUser(),
        avatar: userDoc.avatar
      }
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
};
