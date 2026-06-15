import multer from "multer";
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import path from "path";
import fs from "fs";

let storage: any;

const isCloudinaryConfigured = !!(
  process.env.CLOUD_NAME &&
  process.env.CLOUD_API_KEY &&
  process.env.CLOUD_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'gym-general-uploads',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
    } as any,
  });
} else {
  // Ensure local uploads directory exists
  const uploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
      );
    },
  });
}

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit (Strict enforcement)
  },
  fileFilter,
});

// File filter for CSV and XML files
const bulkUploadFileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "text/xml",
    "application/xml",
  ];
  const allowedExtensions = [".csv", ".xml"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (
    allowedTypes.includes(file.mimetype) ||
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only CSV and XML files are allowed."));
  }
};

// Multer configuration for bulk upload (using memory storage for parsing)
export const bulkUpload = multer({
  storage: multer.memoryStorage(), // Store in memory for parsing
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for bulk uploads
  },
  fileFilter: bulkUploadFileFilter,
});

export default upload;