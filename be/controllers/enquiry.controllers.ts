import type { Request, Response } from 'express';
import Enquiry, { type IEnquiry } from '../models/enquiry.model';
import { Types } from 'mongoose';

// POST: Create a new enquiry (user-based)
export const createEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      name,
      phone,
      email,
      source,
      status,
      assignedStaff,
      followUpDate,
      comments,
      interests,
      budget,
    } = req.body;

    // Get userId from authenticated user (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    // Validate required fields (additional runtime check beyond Mongoose)
    if (!name || !phone || !source) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and source are required fields.',
      });
    }

    // Optional: Validate ObjectId format for assignedStaff if provided
    if (assignedStaff && !Types.ObjectId.isValid(assignedStaff)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID format.',
      });
    }

    // Build the enquiry object
    const enquiryData: Partial<IEnquiry> = {
      userId,
      name,
      phone,
      email,
      source,
      status: status || 'new', // default to 'new' if not provided
      assignedStaff: assignedStaff ? new Types.ObjectId(assignedStaff) : null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      comments: comments || '',
      interests: interests || '',
      budget: budget || '',
    };

    // Create new enquiry
    const enquiry = new Enquiry(enquiryData);
    const savedEnquiry = await enquiry.save();

    return res.status(201).json({
      success: true,
      message: 'Enquiry created successfully',
      data: savedEnquiry,
    });
  } catch (error: any) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
      });
    }

    // Handle duplicate key or cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid value for field: ${error.path}`,
      });
    }

    console.error('Error creating enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not create enquiry.',
    });
  }
};

// GET: Fetch all enquiries (admin or filtered)
// GET: Fetch enquiries — but only the current user's own enquiries
// Even admins can only see their own
export const getEnquiries = async (req: Request, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 10, status, source } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10)); // Cap limit at 100
    const currentUser = req.user;

    if (!currentUser || !currentUser.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    if (!Types.ObjectId.isValid(currentUser.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    // 🔒 Filter: only enquiries created by this user
    const filter: any = {
      userId: new Types.ObjectId(currentUser.id),
    };

    // Optional filters (only on their own data)
    if (status) filter.status = status;
    if (source) filter.source = source;

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .populate('userId', 'name email')
        .populate('assignedStaff', 'name email role')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),

      Enquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Your enquiries retrieved successfully',
      data: enquiries,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching enquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not retrieve your enquiries.',
    });
  }
};

// GET: Fetch a single enquiry by ID
export const getEnquiryById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
  return res.status(400).json({
    success: false,
    message: 'Enquiry ID is required.',
  });
}

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID format.',
      });
    }

    const enquiry = await Enquiry.findById(id)
      .populate('userId', 'name email')
      .populate('assignedStaff', 'name email role');

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry retrieved successfully',
      data: enquiry,
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID.',
      });
    }

    console.error('Error retrieving enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not retrieve enquiry.',
    });
  }
};

// PUT: Update an enquiry
export const updateEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      source,
      status,
      assignedStaff,
      followUpDate,
      comments,
      interests,
      budget,
    } = req.body;

    if (!id) {
  return res.status(400).json({
    success: false,
    message: 'Enquiry ID is required.',
  });
}

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID.',
      });
    }

    const updateData: Partial<IEnquiry> = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (source) updateData.source = source;
    if (status) updateData.status = status;
    if (comments) updateData.comments = comments;
    if (interests) updateData.interests = interests;
    if (budget) updateData.budget = budget;

    if (assignedStaff !== undefined) {
      if (!assignedStaff) {
        updateData.assignedStaff = null;
      } else if (Types.ObjectId.isValid(assignedStaff)) {
        updateData.assignedStaff = new Types.ObjectId(assignedStaff);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid staff ID format.',
        });
      }
    }

    if (followUpDate) {
      const date = new Date(followUpDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid follow-up date.',
        });
      }
      updateData.followUpDate = date;
    }

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('userId', 'name email')
      .populate('assignedStaff', 'name email role');

    if (!updatedEnquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully',
      data: updatedEnquiry,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid value for field: ${error.path}`,
      });
    }

    console.error('Error updating enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not update enquiry.',
    });
  }
};

// DELETE: Delete an enquiry (hard delete)
export const deleteEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
  return res.status(400).json({
    success: false,
    message: 'Enquiry ID is required.',
  });
}

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID.',
      });
    }

    const deletedEnquiry = await Enquiry.findByIdAndDelete(id);

    if (!deletedEnquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not delete enquiry.',
    });
  }
};

// GET: Get all enquiries created by the authenticated user
export const getEnquiriesByUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    const enquiries = await Enquiry.find({ userId: new Types.ObjectId(userId) })
      .populate('assignedStaff', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Your enquiries retrieved successfully',
      data: enquiries,
    });
  } catch (error: any) {
    console.error('Error fetching user enquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not retrieve your enquiries.',
    });
  }
};

// PATCH: Assign staff to an enquiry
export const assignStaffToEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!id) {
  return res.status(400).json({
    success: false,
    message: 'Enquiry ID is required.',
  });
}

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID.',
      });
    }

    if (!staffId || !Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid staff ID is required.',
      });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { assignedStaff: new Types.ObjectId(staffId) },
      { new: true, runValidators: true }
    ).populate('assignedStaff', 'name email role');

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Staff assigned successfully',
      data: enquiry,
    });
  } catch (error: any) {
    console.error('Error assigning staff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not assign staff.',
    });
  }
};