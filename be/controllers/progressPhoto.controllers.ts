import type { Request, Response } from 'express';
import ProgressPhoto from '../models/progressPhoto.model';

/**
 * Helper to resolve correct photo url depending on storage type (Cloudinary vs Local Disk)
 */
const getPhotoUrl = (fileArr?: any[]) => {
  if (!fileArr || fileArr.length === 0) return undefined;
  const file = fileArr[0];
  // If Cloudinary storage is configured, file.path is the secure URL
  if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
    return file.path;
  }
  // Otherwise serve it statically from local backend upload folder
  return `/uploads/progress-photos/${file.filename}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/progress-photos/upload
// Member uploads front, side, and/or back photos along with active metrics
// ─────────────────────────────────────────────────────────────────────────────
export const uploadProgressPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const files = req.files as { [fieldname: string]: any[] };

    if (!files || (!files.frontPhoto && !files.sidePhoto && !files.backPhoto)) {
      res.status(400).json({ success: false, message: 'Please upload at least one pose photo (Front, Side, or Back).' });
      return;
    }

    const frontPhoto = getPhotoUrl(files.frontPhoto);
    const sidePhoto = getPhotoUrl(files.sidePhoto);
    const backPhoto = getPhotoUrl(files.backPhoto);

    const weight = req.body.weight ? parseFloat(req.body.weight) : undefined;
    const bodyFat = req.body.bodyFat ? parseFloat(req.body.bodyFat) : undefined;
    const notes = req.body.notes || '';

    const newRecord = await ProgressPhoto.create({
      member: user.id || user._id,
      frontPhoto,
      sidePhoto,
      backPhoto,
      weight,
      bodyFat,
      notes,
      takenAt: req.body.takenAt ? new Date(req.body.takenAt) : new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Progress photos submitted successfully!',
      record: newRecord,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to save progress entry.',
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/progress-photos/timeline
// Retrieves logged-in member's complete secure progress history
// ─────────────────────────────────────────────────────────────────────────────
export const getTimeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    const timeline = await ProgressPhoto.find({ member: user.id || user._id })
      .sort({ takenAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      total: timeline.length,
      timeline,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve progress timeline.',
      error: error.message,
    });
  }
};
