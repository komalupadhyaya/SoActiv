# Full Staff Controller Code

## Complete Enhanced Staff Controller

Below is the full `staff.controllers.ts` file with automatic user creation and email notification:

```typescript
// controllers/staff.controller.ts
 
import type { Request, Response } from 'express';
import { Staff } from '../models/staff.model';
import { User } from '../models/user.model';
import type { IStaff } from '../models/staff.model';
import type { FilterQuery } from 'mongoose';
import { generateSecurePassword } from '../utils/password.util';
import { sendStaffWelcomeEmail } from '../utils/emailSender';
 
/**
 * Create a new staff member with automatic User account creation
 * This creates both a User record (for authentication) and a Staff record (for staff details)
 */
export const createStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get admin user info from auth middleware
    const adminUserId = (req as any).user?.id;
    const adminGymId = (req as any).user?.gym;

    if (!adminUserId || !adminGymId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated or gym not found',
      });
      return;
    }

    const { fullName, email, position, contactNumber, joiningDate, salary, status, notifications } = req.body;

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
      return;
    }

    // Check if staff with this email already exists
    const existingStaff = await Staff.findOne({ email: email.toLowerCase() });
    if (existingStaff) {
      res.status(400).json({
        success: false,
        message: 'A staff member with this email already exists',
      });
      return;
    }

    // 1️⃣ Generate secure password
    const generatedPassword = generateSecurePassword(12);

    // 2️⃣ Create User account
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
    console.log('✅ User account created:', savedUser._id);

    // 3️⃣ Create Staff record
    const newStaff = new Staff({
      userId: savedUser._id,
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

    // 4️⃣ Send welcome email with credentials
    const emailResult = await sendStaffWelcomeEmail(
      email.toLowerCase(),
      fullName,
      generatedPassword
    );

    if (!emailResult.success) {
      console.warn('⚠️ Email sending failed:', emailResult.error);
      // Don't fail the entire operation if email fails
    } else {
      console.log('✅ Welcome email sent:', emailResult.messageId);
    }

    // 5️⃣ Return success response
    res.status(201).json({
      success: true,
      message: 'Staff created successfully. Welcome email sent with login credentials.',
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
  } catch (error: any) {
    console.error('❌ Error in createStaff:', error);
    
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Staff with this email or phone number already exists.',
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create staff member',
      error: error.message,
    });
  }
};
```

## Key Features

### 1. User Account Creation
- **Role**: Automatically set to `"staff"`
- **Gym**: Inherits from admin's gym for multi-tenant isolation
- **Password**: Auto-generated 12-character secure password
- **Avatar**: Auto-generated using UI Avatars API

### 2. Staff Record Creation
- **userId**: Links to created User account
- **gym**: Same as admin's gym
- **All Details**: From form submission

### 3. Email Notification
- **Service**: Resend SDK
- **Template**: Professional HTML with branding
- **Contents**: Email, password, login link
- **Error Handling**: Email failure doesn't prevent staff creation

### 4. Response Structure
```json
{
  "success": true,
  "message": "Staff created successfully. Welcome email sent with login credentials.",
  "data": {
    "staff": { /* full staff object */ },
    "user": {
      "id": "...",
      "email": "...",
      "fullname": "...",
      "role": "staff"
    },
    "emailSent": true
  }
}
```

## Environment Variables Required

```env
RESEND_API_KEY=re_QZzbeWEq_2dfRZwoENFCv3mauYaNocp59
EMAIL_FROM=SoActiv <noreply@yourdomain.com>
APP_URL=http://localhost:5173
```

## Testing

1. **Create Staff**: POST `/api/staff` with staff details
2. **Check Database**: Verify User and Staff records created
3. **Check Email**: Verify welcome email received
4. **Test Login**: Use credentials from email to log in

## Files Created

- `utils/password.util.ts` - Password generator
- `utils/emailSender.ts` - Resend email service
- `controllers/staff.controllers.ts` - Enhanced controller (shown above)
- `models/staff.model.ts` - Updated with gym field

## Next Steps

1. Add environment variables to `.env`
2. Test staff creation
3. Verify email delivery
4. Test staff login
