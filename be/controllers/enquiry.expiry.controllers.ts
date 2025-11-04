// controllers/enquiry.expiry.controllers.ts

import type { Request, Response } from 'express';
import Enquiry from '../models/enquiry.model';

/**
 * @route   GET /api/v1/enquiry/expiring
 * @desc    Get all enquiries that are expiring soon (within 7 days) or already expired
 * @access  Private (Admin, Sales)
 */
export const getExpiringEnquiries = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query; // Default: show enquiries expiring within 7 days
    const daysThreshold = parseInt(days as string, 10);

    // Get all enquiries
    const allEnquiries = await Enquiry.find()
      .populate('assignedStaff', 'fullName position')
      .sort({ expiryDate: 1 });

    // Recalculate expiry status for each enquiry
    const today = new Date();
    const updatedEnquiries = allEnquiries.map((enquiry) => {
      const expiry = new Date(enquiry.expiryDate);
      const timeDiff = expiry.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      enquiry.remainingDays = daysDiff;
      enquiry.isExpired = daysDiff <= 0;
      
      return enquiry;
    });

    // Filter for expiring soon or already expired
    const expiringEnquiries = updatedEnquiries.filter(
      (enquiry) => enquiry.remainingDays <= daysThreshold
    );

    // Separate into categories
    const expired = expiringEnquiries.filter((e) => e.isExpired);
    const expiringSoon = expiringEnquiries.filter((e) => !e.isExpired);

    return res.status(200).json({
      success: true,
      message: 'Expiring enquiries fetched successfully',
      data: {
        total: expiringEnquiries.length,
        expired: expired.length,
        expiringSoon: expiringSoon.length,
        enquiries: expiringEnquiries,
        categories: {
          expired,
          expiringSoon,
        },
      }
    });
  } catch (error: any) {
    console.error('Get expiring enquiries error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring enquiries',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/v1/enquiry/:id/extend-expiry
 * @desc    Extend the expiry date of an enquiry
 * @access  Private (Admin, Sales)
 */
export const extendEnquiryExpiry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { additionalDays } = req.body;

    if (!additionalDays || additionalDays < 1) {
      return res.status(400).json({
        success: false,
        message: 'Additional days must be at least 1'
      });
    }

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found'
      });
    }

    // Extend expiry
    enquiry.expiryDays += additionalDays;
    await enquiry.save(); // Pre-save hook will recalculate expiryDate

    return res.status(200).json({
      success: true,
      message: `Enquiry expiry extended by ${additionalDays} days`,
      data: enquiry
    });
  } catch (error: any) {
    console.error('Extend enquiry expiry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to extend enquiry expiry',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/v1/enquiry/update-expiry-status
 * @desc    Batch update expiry status for all enquiries (cron job endpoint)
 * @access  Private (Admin only)
 */
export const updateEnquiryExpiryStatus = async (req: Request, res: Response) => {
  try {
    const enquiries = await Enquiry.find();
    const today = new Date();
    let updatedCount = 0;

    for (const enquiry of enquiries) {
      const expiry = new Date(enquiry.expiryDate);
      const timeDiff = expiry.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      const wasExpired = enquiry.isExpired;
      enquiry.remainingDays = daysDiff;
      enquiry.isExpired = daysDiff <= 0;

      if (wasExpired !== enquiry.isExpired) {
        await enquiry.save();
        updatedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Updated expiry status for ${updatedCount} enquiries`,
      data: { updatedCount }
    });
  } catch (error: any) {
    console.error('Update enquiry expiry status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update enquiry expiry status',
      error: error.message
    });
  }
};

