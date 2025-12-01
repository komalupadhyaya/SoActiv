// controllers/enquiry.bulk.controllers.ts
import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Papa from 'papaparse';
import Enquiry, { type IEnquiry } from '../models/enquiry.model';

/* -------------------- Interfaces -------------------- */
interface BulkUploadResult {
  success: boolean;
  message: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
  };
  details: {
    successful: Array<{
      row: number;
      name: string;
      email: string;
      phone: string;
    }>;
    failed: Array<{
      row: number;
      data: any;
      reason: string;
      errors: string[];
    }>;
  };
}

interface ParsedEnquiryData {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status?: string;
  comments?: string;
  interests?: string;
  budget?: string;
  followUpDate?: string;
}

/* -------------------- Validation Helpers -------------------- */
const isValidEmail = (email: string): boolean => /^\S+@\S+\.\S+$/.test(email);
const isValidPhone = (phone: string): boolean => /^\+?[1-9]\d{1,14}$/.test(phone);

const isValidSource = (source: string): boolean => {
  const validSources = ['website', 'social-media', 'referral', 'walk-in', 'advertisement', 'other'];
  return validSources.includes(source.toLowerCase());
};

const isValidStatus = (status: string): boolean => {
  const validStatuses = ['new', 'contacted', 'interested', 'converted', 'lost'];
  return validStatuses.includes(status.toLowerCase());
};

const validateEnquiryData = (data: ParsedEnquiryData, row: number): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Name is required');
  } else if (data.name.length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  if (!data.phone?.trim()) {
    errors.push('Phone number is required');
  } else if (!isValidPhone(data.phone.trim())) {
    errors.push('Invalid phone number format (use international format, e.g., +1234567890)');
  }

  if (data.email?.trim() && !isValidEmail(data.email.trim())) {
    errors.push('Invalid email format');
  }

  if (!data.source?.trim()) {
    errors.push('Source is required');
  } else if (!isValidSource(data.source.trim())) {
    errors.push('Invalid source (must be: website, social-media, referral, walk-in, advertisement, or other)');
  }

  if (data.status?.trim() && !isValidStatus(data.status.trim())) {
    errors.push('Invalid status (must be: new, contacted, interested, converted, or lost)');
  }

  if (data.comments && data.comments.length > 1000) errors.push('Comments cannot exceed 1000 characters');
  if (data.interests && data.interests.length > 500) errors.push('Interests cannot exceed 500 characters');
  if (data.budget && data.budget.length > 100) errors.push('Budget cannot exceed 100 characters');

  return { valid: errors.length === 0, errors };
};

/* -------------------- File Parsers -------------------- */
const parseCSV = (fileContent: string): Promise<ParsedEnquiryData[]> =>
  new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim().replace(/\s+/g, ''),
      complete: (results) => resolve(results.data as ParsedEnquiryData[]),
      error: (error: any) => reject(error),
    });
  });

const parseXML = (fileContent: string): Promise<ParsedEnquiryData[]> =>
  new Promise((resolve, reject) => {
    try {
      const enquiries: ParsedEnquiryData[] = [];
      const entryRegex = /<(?:enquiry|entry)>([\s\S]*?)<\/(?:enquiry|entry)>/gi;
      const entries = fileContent.match(entryRegex);
      if (!entries) return reject(new Error('No valid enquiry entries found in XML file'));

      entries.forEach((entry) => {
        const extract = (field: string): string => {
          const regex = new RegExp(`<${field}>(.*?)<\/${field}>`, 'i');
          return entry.match(regex)?.[1]?.trim() || '';
        };

        enquiries.push({
          name: extract('name'),
          phone: extract('phone'),
          email: extract('email'),
          source: extract('source'),
          status: extract('status'),
          comments: extract('comments'),
          interests: extract('interests'),
          budget: extract('budget'),
          followUpDate: extract('followupdate') || extract('followUpDate'),
        });
      });

      resolve(enquiries);
    } catch (err) {
      reject(err);
    }
  });

/* -------------------- Controller -------------------- */
export const bulkUploadEnquiries = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please upload a CSV or XML file.' });
    }

    const file = req.file;
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xml'].includes(ext)) {
      return res.status(400).json({ success: false, message: 'Invalid file type. Only CSV and XML files are supported.' });
    }

    const content = file.buffer.toString('utf-8');
    const parsedData = ext === 'csv' ? await parseCSV(content) : await parseXML(content);
    if (!parsedData?.length) {
      return res.status(400).json({ success: false, message: 'No valid data found in the uploaded file' });
    }

    const result: BulkUploadResult = {
      success: true,
      message: 'Bulk upload completed',
      summary: { total: parsedData.length, successful: 0, failed: 0, duplicates: 0 },
      details: { successful: [], failed: [] },
    };

    /* --- Fetch existing emails for this user's gym only --- */
    const emails = parsedData
      .filter((d) => d.email?.trim())
      .map((d) => d.email!.toLowerCase().trim());

    const existingEmails = new Set<string>();
    if (emails.length > 0) {
      const found = await Enquiry.find({ userId, email: { $in: emails } }).select('email');
      found.forEach((f) => f.email && existingEmails.add(f.email.toLowerCase()));
    }

    /* --- Process each row --- */
    for (let i = 0; i < parsedData.length; i++) {
      const rowNumber = i + 2;
      const entry = parsedData[i];
      if (!entry) continue;

      const { valid, errors } = validateEnquiryData(entry, rowNumber);
      if (!valid) {
        result.summary.failed++;
        result.details.failed.push({ row: rowNumber, data: entry, reason: 'Validation failed', errors });
        continue;
      }

      const emailKey = entry.email?.toLowerCase().trim();
      if (emailKey && existingEmails.has(emailKey)) {
        result.summary.failed++;
        result.summary.duplicates++;
        result.details.failed.push({
          row: rowNumber,
          data: entry,
          reason: 'Duplicate email for your gym',
          errors: [`Email '${entry.email}' already exists under this gym account`],
        });
        continue;
      }

      try {
        const enquiry: Partial<IEnquiry> = {
          userId: new Types.ObjectId(userId),
          name: entry.name.trim(),
          phone: entry.phone.trim(),
          email: entry.email?.trim() || '',
          source: (entry.source?.trim().toLowerCase() || 'other') as any,
          status: (entry.status?.trim().toLowerCase() || 'new') as any,
          comments: entry.comments?.trim() || '',
          interests: entry.interests?.trim() || '',
          budget: entry.budget?.trim() || '',
          followUpDate: entry.followUpDate ? new Date(entry.followUpDate) : null,
          assignedStaff: null,
        };

        await Enquiry.create(enquiry);
        if (emailKey) existingEmails.add(emailKey);

        result.summary.successful++;
        result.details.successful.push({
          row: rowNumber,
          name: entry.name,
          email: entry.email || '',
          phone: entry.phone,
        });
      } catch (err: any) {
        // Catch MongoDB duplicate index error (E11000)
        if (err.code === 11000 && err.keyPattern?.email) {
          result.summary.failed++;
          result.summary.duplicates++;
          result.details.failed.push({
            row: rowNumber,
            data: entry,
            reason: 'Duplicate email (DB constraint)',
            errors: [`Email '${entry.email}' already exists under this gym`],
          });
        } else {
          result.summary.failed++;
          result.details.failed.push({
            row: rowNumber,
            data: entry,
            reason: 'Database error',
            errors: [err.message],
          });
        }
      }
    }

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('Bulk upload error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during bulk upload',
      error: err.message,
    });
  }
};
