// controllers/staff.bulk.controllers.ts
import type { Request, Response } from 'express';
import { Staff } from '../models/staff.model';
import Papa from 'papaparse';

// Bulk upload result interfaces
interface BulkUploadSummary {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
}

interface SuccessfulEntry {
  row: number;
  fullName: string;
  email: string;
  position: string;
}

interface FailedEntry {
  row: number;
  data: any;
  reason: string;
  errors: string[];
}

interface BulkUploadResult {
  success: boolean;
  message: string;
  summary: BulkUploadSummary;
  details: {
    successful: SuccessfulEntry[];
    failed: FailedEntry[];
  };
}

// Helper: Parse CSV
const parseCSV = (fileContent: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, ''),
      complete: (results) => resolve(results.data),
      error: (error: Error) => reject(error),
    });
  });
};

// Helper: Parse XML
const parseXML = (fileContent: string): any[] => {
  const entries: any[] = [];
  const entryRegex = /<(?:staff|entry)>([\s\S]*?)<\/(?:staff|entry)>/gi;
  const matches = fileContent.matchAll(entryRegex);

  for (const match of matches) {
    const entryContent = match[1];
    const entry: any = {};

    const fieldRegex = /<(\w+)>(.*?)<\/\1>/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(entryContent)) !== null) {
      const fieldName = fieldMatch[1].toLowerCase();
      const fieldValue = fieldMatch[2].trim();
      entry[fieldName] = fieldValue;
    }

    if (Object.keys(entry).length > 0) {
      entries.push(entry);
    }
  }

  return entries;
};

// Helper: Validate email format
const isValidEmail = (email: string): boolean => {
  return /^\S+@\S+\.\S+$/.test(email);
};

// Helper: Validate phone format
const isValidPhone = (phone: string): boolean => {
  return /^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone);
};

// Helper: Validate status
const isValidStatus = (status: string): boolean => {
  return ['active', 'inactive'].includes(status.toLowerCase());
};

// Helper: Validate staff data
const validateStaffData = (data: any): string[] => {
  const errors: string[] = [];

  // Required fields
  if (!data.fullname || data.fullname.trim().length < 2) {
    errors.push('Full name is required (min 2 characters)');
  }

  if (!data.position || data.position.trim().length === 0) {
    errors.push('Position is required');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.contactnumber || !isValidPhone(data.contactnumber)) {
    errors.push('Valid contact number is required');
  }

  if (!data.joiningdate) {
    errors.push('Joining date is required');
  }

  if (!data.salary || isNaN(Number(data.salary)) || Number(data.salary) < 0) {
    errors.push('Valid salary is required (must be >= 0)');
  }

  // Optional status validation
  if (data.status && !isValidStatus(data.status)) {
    errors.push('Status must be active or inactive');
  }

  return errors;
};

// Main bulk upload controller
export const bulkUploadStaff = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

    let parsedData: any[] = [];

    // Parse based on file type
    if (fileExtension === 'csv') {
      parsedData = await parseCSV(fileContent);
    } else if (fileExtension === 'xml') {
      parsedData = parseXML(fileContent);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only CSV and XML are supported.',
      });
    }

    if (parsedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid data found in the uploaded file',
      });
    }

    // Get all existing emails and phones for duplicate checking
    const existingStaff = await Staff.find({ userId }, 'email contactNumber');
    const existingEmails = new Set(existingStaff.map(s => s.email.toLowerCase()));
    const existingPhones = new Set(existingStaff.map(s => s.contactNumber));

    const result: BulkUploadResult = {
      success: true,
      message: 'Bulk upload completed',
      summary: {
        total: parsedData.length,
        successful: 0,
        failed: 0,
        duplicates: 0,
      },
      details: {
        successful: [],
        failed: [],
      },
    };

    // Track emails/phones in current batch to prevent duplicates within the same upload
    const batchEmails = new Set<string>();
    const batchPhones = new Set<string>();

    // Process each entry
    for (let i = 0; i < parsedData.length; i++) {
      const entry = parsedData[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and we're 0-indexed

      // Validate entry
      const validationErrors = validateStaffData(entry);

      if (validationErrors.length > 0) {
        result.summary.failed++;
        result.details.failed.push({
          row: rowNumber,
          data: entry,
          reason: 'Validation failed',
          errors: validationErrors,
        });
        continue;
      }

      const email = entry.email.toLowerCase();
      const phone = entry.contactnumber;

      // Check for duplicate email
      if (existingEmails.has(email) || batchEmails.has(email)) {
        result.summary.failed++;
        result.summary.duplicates++;
        result.details.failed.push({
          row: rowNumber,
          data: entry,
          reason: 'Duplicate email',
          errors: ['Email already exists in the system'],
        });
        continue;
      }

      // Check for duplicate phone
      if (existingPhones.has(phone) || batchPhones.has(phone)) {
        result.summary.failed++;
        result.summary.duplicates++;
        result.details.failed.push({
          row: rowNumber,
          data: entry,
          reason: 'Duplicate phone',
          errors: ['Contact number already exists in the system'],
        });
        continue;
      }

      // Try to save to database
      try {
        const staffData: any = {
          userId,
          fullName: entry.fullname.trim(),
          position: entry.position.trim(),
          email: email,
          contactNumber: phone,
          joiningDate: new Date(entry.joiningdate),
          salary: Number(entry.salary),
          status: entry.status ? entry.status.toLowerCase() : 'active',
          notifications: {
            sms: entry.notificationsms !== 'false',
            email: entry.notificationemail !== 'false',
            push: entry.notificationpush !== 'false',
            whatsapp: entry.notificationwhatsapp !== 'false',
          },
        };

        const newStaff = new Staff(staffData);
        await newStaff.save();

        batchEmails.add(email);
        batchPhones.add(phone);
        result.summary.successful++;
        result.details.successful.push({
          row: rowNumber,
          fullName: staffData.fullName,
          email: staffData.email,
          position: staffData.position,
        });
      } catch (error: any) {
        result.summary.failed++;
        result.details.failed.push({
          row: rowNumber,
          data: entry,
          reason: 'Database error',
          errors: [error.message || 'Failed to save staff member'],
        });
      }
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk upload',
      error: error.message,
    });
  }
};

