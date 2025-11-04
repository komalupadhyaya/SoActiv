// controllers/enquiry.bulk.controllers.ts
import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import Papa from 'papaparse';
import Enquiry, { type IEnquiry } from '../models/enquiry.model';

// Interface for bulk upload result
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

// Interface for parsed enquiry data
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

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
};

// Validate phone format
const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Validate enquiry source
const isValidSource = (source: string): boolean => {
  const validSources = ['website', 'social-media', 'referral', 'walk-in', 'advertisement', 'other'];
  return validSources.includes(source.toLowerCase());
};

// Validate enquiry status
const isValidStatus = (status: string): boolean => {
  const validStatuses = ['new', 'contacted', 'interested', 'converted', 'lost'];
  return validStatuses.includes(status.toLowerCase());
};

// Validate a single enquiry entry
const validateEnquiryData = (data: ParsedEnquiryData, row: number): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields validation
  if (!data.name || data.name.trim() === '') {
    errors.push('Name is required');
  } else if (data.name.length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  if (!data.phone || data.phone.trim() === '') {
    errors.push('Phone number is required');
  } else if (!isValidPhone(data.phone.trim())) {
    errors.push('Invalid phone number format (use international format, e.g., +1234567890)');
  }

  // Email validation (optional but must be valid if provided)
  if (data.email && data.email.trim() !== '') {
    if (!isValidEmail(data.email.trim())) {
      errors.push('Invalid email format');
    }
  }

  // Source validation (required)
  if (!data.source || data.source.trim() === '') {
    errors.push('Source is required');
  } else if (!isValidSource(data.source.trim())) {
    errors.push('Invalid source (must be: website, social-media, referral, walk-in, advertisement, or other)');
  }

  // Status validation (optional)
  if (data.status && data.status.trim() !== '' && !isValidStatus(data.status.trim())) {
    errors.push('Invalid status (must be: new, contacted, interested, converted, or lost)');
  }

  // Field length validations
  if (data.comments && data.comments.length > 1000) {
    errors.push('Comments cannot exceed 1000 characters');
  }

  if (data.interests && data.interests.length > 500) {
    errors.push('Interests cannot exceed 500 characters');
  }

  if (data.budget && data.budget.length > 100) {
    errors.push('Budget cannot exceed 100 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Parse CSV file
const parseCSV = (fileContent: string): Promise<ParsedEnquiryData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize headers to lowercase and remove spaces
        return header.toLowerCase().trim().replace(/\s+/g, '');
      },
      complete: (results) => {
        resolve(results.data as ParsedEnquiryData[]);
      },
      error: (error: any) => {
        reject(error);
      },
    });
  });
};

// Parse XML file
const parseXML = (fileContent: string): Promise<ParsedEnquiryData[]> => {
  return new Promise((resolve, reject) => {
    try {
      // Simple XML parsing (for basic structure)
      const enquiries: ParsedEnquiryData[] = [];
      
      // Match all <enquiry> or <entry> tags
      const entryRegex = /<(?:enquiry|entry)>([\s\S]*?)<\/(?:enquiry|entry)>/gi;
      const entries = fileContent.match(entryRegex);

      if (!entries || entries.length === 0) {
        return reject(new Error('No valid enquiry entries found in XML file'));
      }

      entries.forEach((entry) => {
        const enquiry: any = {};
        
        // Extract field values
        const extractField = (fieldName: string): string => {
          const regex = new RegExp(`<${fieldName}>(.*?)<\/${fieldName}>`, 'i');
          const match = entry?.match(regex);
          return match?.[1]?.trim() || '';
        };

        enquiry.name = extractField('name');
        enquiry.phone = extractField('phone');
        enquiry.email = extractField('email');
        enquiry.source = extractField('source');
        enquiry.status = extractField('status');
        enquiry.comments = extractField('comments');
        enquiry.interests = extractField('interests');
        enquiry.budget = extractField('budget');
        enquiry.followUpDate = extractField('followupdate') || extractField('followUpDate');

        enquiries.push(enquiry);
      });

      resolve(enquiries);
    } catch (error) {
      reject(error);
    }
  });
};

// POST: Bulk upload enquiries from CSV or XML
export const bulkUploadEnquiries = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a CSV or XML file.',
      });
    }

    const file = req.file;
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    // Validate file type
    if (!fileExtension || !['csv', 'xml'].includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only CSV and XML files are supported.',
      });
    }

    // Read file content
    const fileContent = file.buffer.toString('utf-8');

    // Parse file based on type
    let parsedData: ParsedEnquiryData[];
    try {
      if (fileExtension === 'csv') {
        parsedData = await parseCSV(fileContent);
      } else {
        parsedData = await parseXML(fileContent);
      }
    } catch (parseError: any) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse file',
        error: parseError.message,
      });
    }

    if (!parsedData || parsedData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid data found in the uploaded file',
      });
    }

    // Initialize result tracking
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

    // Get all existing emails to check for duplicates
    const existingEmails = new Set<string>();
    if (parsedData.some(entry => entry.email)) {
      const emails = parsedData
        .filter(entry => entry.email && entry.email.trim() !== '')
        .map(entry => entry.email!.toLowerCase().trim());
      
      const existingEnquiries = await Enquiry.find({
        email: { $in: emails },
      }).select('email');

      existingEnquiries.forEach(enquiry => {
        if (enquiry.email) {
          existingEmails.add(enquiry.email.toLowerCase());
        }
      });
    }

    // Process each entry
    for (let i = 0; i < parsedData.length; i++) {
      const rowNumber = i + 2; // +2 because row 1 is header, and array is 0-indexed
      const entry = parsedData[i];

      // Skip if entry is undefined
      if (!entry) continue;

      // Validate entry
      const validation = validateEnquiryData(entry, rowNumber);

      if (!validation.valid) {
        result.summary.failed++;
        result.details.failed.push({
          row: rowNumber,
          data: entry,
          reason: 'Validation failed',
          errors: validation.errors,
        });
        continue;
      }

      // Check for duplicate email
      const emailToCheck = entry.email?.toLowerCase().trim();
      if (emailToCheck && existingEmails.has(emailToCheck)) {
        result.summary.failed++;
        result.summary.duplicates++;
        result.details.failed.push({
          row: rowNumber,
          data: entry,
          reason: 'Duplicate email',
          errors: [`Email '${entry.email}' already exists in the system`],
        });
        continue;
      }

      // Create enquiry
      try {
        const enquiryData: Partial<IEnquiry> = {
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

        const enquiry = new Enquiry(enquiryData);
        await enquiry.save();

        // Add email to existing set to prevent duplicates within the same upload
        if (emailToCheck) {
          existingEmails.add(emailToCheck);
        }

        result.summary.successful++;
        result.details.successful.push({
          row: rowNumber,
          name: entry.name,
          email: entry.email || '',
          phone: entry.phone,
        });
      } catch (saveError: any) {
        result.summary.failed++;
        result.details.failed.push({
          row: rowNumber,
          data: entry,
          reason: 'Database error',
          errors: [saveError.message || 'Failed to save enquiry'],
        });
      }
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in bulk upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during bulk upload',
      error: error.message,
    });
  }
};

