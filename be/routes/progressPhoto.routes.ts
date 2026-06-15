import { Router } from 'express';
import { uploadProgressPhotos, getTimeline } from '../controllers/progressPhoto.controllers';
import { progressUpload } from '../config/cloudinary.config';
import { authMiddleware } from '../middlewares/auth.middleware';
import { checkGymFeature } from '../middlewares/featureFlag.middleware';

const progressPhotoRouter = Router();

// GET /api/v1/progress-photos/timeline
// Fetch the complete chronological timeline for logged-in member
progressPhotoRouter.get('/timeline', authMiddleware, checkGymFeature('memberPortal'), getTimeline);

// POST /api/v1/progress-photos/upload
// Upload up to three pose files and body metrics (frontPhoto, sidePhoto, backPhoto)
progressPhotoRouter.post(
  '/upload',
  authMiddleware,
  checkGymFeature('memberPortal'),
  progressUpload.fields([
    { name: 'frontPhoto', maxCount: 1 },
    { name: 'sidePhoto', maxCount: 1 },
    { name: 'backPhoto', maxCount: 1 },
  ]),
  uploadProgressPhotos
);

export default progressPhotoRouter;
