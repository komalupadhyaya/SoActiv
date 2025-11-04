# Bulk Upload Enquiries Feature - Technical Documentation

## Overview
This document provides technical details about the Bulk Upload Enquiries feature implementation.

## Architecture

### Backend Components

#### 1. Controller: `be/controllers/enquiry.bulk.controllers.ts`
**Purpose**: Handles bulk upload logic, file parsing, validation, and database operations.

**Key Functions**:
- `bulkUploadEnquiries()` - Main endpoint handler
- `parseCSV()` - Parses CSV files using PapaParse
- `parseXML()` - Parses XML files using regex-based extraction
- `validateEnquiryData()` - Validates individual enquiry entries
- `isValidEmail()`, `isValidPhone()`, `isValidSource()`, `isValidStatus()` - Field validators

**Features**:
- Supports CSV and XML file formats
- Validates all required and optional fields
- Checks for duplicate emails in database
- Prevents duplicate emails within the same upload
- Returns detailed success/error report

#### 2. Middleware: `be/middlewares/upload.middleware.ts`
**Purpose**: Configures Multer for file upload handling.

**Configuration**:
- Uses memory storage for immediate parsing
- File size limit: 10MB
- Accepts: CSV (.csv) and XML (.xml) files
- MIME types: text/csv, application/vnd.ms-excel, text/xml, application/xml

#### 3. Route: `be/routes/enquiry.routes.ts`
**Endpoint**: `POST /api/v1/enquiry/bulk-upload`
**Middleware**: `authMiddleware`, `bulkUpload.single('file')`
**Access**: Private (authenticated users only)

### Frontend Components

#### 1. Hook: `fe/src/hooks/useEnquiry.tsx`
**New Function**: `bulkUpload(file: File)`
**Purpose**: Handles file upload to backend API

**Features**:
- Creates FormData with file
- Sends multipart/form-data request
- Handles response and errors
- Refreshes enquiry list on success

**New Interface**: `BulkUploadResult`
```typescript
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
    successful: Array<{...}>;
    failed: Array<{...}>;
  };
}
```

#### 2. Component: `fe/src/components/enquiry/BulkUploadModal.tsx`
**Purpose**: Modal for file selection and upload

**Features**:
- Drag-and-drop file upload
- File type validation (CSV/XML only)
- File size validation (max 10MB)
- Sample file download (CSV and XML)
- Upload instructions
- Progress indication
- Results summary display

**User Flow**:
1. Click "Bulk Upload" button
2. Drag-and-drop or select file
3. Review file details
4. Click "Upload"
5. View summary results

#### 3. Component: `fe/src/components/enquiry/UploadResultsReport.tsx`
**Purpose**: Detailed results report modal

**Features**:
- Summary statistics with visual cards
- Success rate progress bar
- Expandable successful entries table
- Expandable failed entries with error details
- Row-by-row error reporting
- Reason categorization (Validation failed, Duplicate email, Database error)

#### 4. Page: `fe/src/pages/admin/EnquiriesPage.tsx`
**Updates**:
- Added "Bulk Upload" button
- Integrated BulkUploadModal
- Integrated UploadResultsReport
- State management for modals and results

## Data Flow

### Upload Process
```
1. User selects file in BulkUploadModal
2. File validated (type, size)
3. User clicks "Upload"
4. useEnquiry.bulkUpload() called
5. FormData created with file
6. POST request to /api/v1/enquiry/bulk-upload
7. Backend receives file via multer
8. File parsed (CSV or XML)
9. Each entry validated
10. Duplicate emails checked
11. Valid entries saved to database
12. Results compiled
13. Response sent to frontend
14. Results displayed in modal
15. Enquiry list refreshed
```

### Validation Flow
```
For each entry:
1. Check required fields (name, phone, source)
2. Validate email format (if provided)
3. Validate phone format
4. Validate source value
5. Validate status value (if provided)
6. Check field length limits
7. Check for duplicate email in database
8. Check for duplicate email in current batch
9. If valid: Save to database
10. If invalid: Add to failed list with errors
```

## File Format Specifications

### CSV Format
- **Header Row**: Required (case-insensitive, spaces ignored)
- **Delimiter**: Comma (,)
- **Encoding**: UTF-8
- **Quotes**: Double quotes for values with commas
- **Empty Fields**: Allowed for optional fields

**Example**:
```csv
name,phone,email,source,status,comments,interests,budget,followUpDate
John Doe,+1234567890,john@example.com,website,new,Interested,Gym,500,2025-12-01
```

### XML Format
- **Root Element**: `<enquiries>`
- **Entry Element**: `<enquiry>` or `<entry>`
- **Field Elements**: Case-insensitive
- **Empty Fields**: Can be omitted or empty tags
- **Encoding**: UTF-8

**Example**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<enquiries>
  <enquiry>
    <name>John Doe</name>
    <phone>+1234567890</phone>
    <email>john@example.com</email>
    <source>website</source>
    <status>new</status>
  </enquiry>
</enquiries>
```

## Validation Rules

### Required Fields
- **name**: 1-100 characters
- **phone**: International format (+[country code][number])
- **source**: One of: website, social-media, referral, walk-in, advertisement, other

### Optional Fields
- **email**: Valid email format (checked for duplicates)
- **status**: One of: new, contacted, interested, converted, lost (default: new)
- **comments**: Max 1000 characters
- **interests**: Max 500 characters
- **budget**: Max 100 characters
- **followUpDate**: Valid date string (YYYY-MM-DD)

### Validation Patterns
- **Email**: `/^\S+@\S+\.\S+$/`
- **Phone**: `/^\+?[1-9]\d{1,14}$/`

## Error Handling

### Backend Errors
- **401 Unauthorized**: User not authenticated
- **400 Bad Request**: No file uploaded, invalid file type, parsing error
- **500 Server Error**: Database or processing error

### Validation Errors
Each failed entry includes:
- Row number (from original file)
- Original data
- Reason category
- Specific error messages array

### Duplicate Detection
- Checks existing database records
- Checks within current upload batch
- Skips duplicates and reports them separately

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Bulk upload completed",
  "summary": {
    "total": 10,
    "successful": 8,
    "failed": 2,
    "duplicates": 1
  },
  "details": {
    "successful": [
      {
        "row": 2,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      }
    ],
    "failed": [
      {
        "row": 3,
        "data": {...},
        "reason": "Validation failed",
        "errors": ["Invalid email format"]
      }
    ]
  }
}
```

## Dependencies

### Backend
- **papaparse**: CSV parsing
- **multer**: File upload handling
- **mongoose**: Database operations

### Frontend
- **axios**: HTTP requests
- **lucide-react**: Icons
- **react**: UI framework

## Security Considerations

1. **Authentication**: All endpoints require authentication
2. **File Size Limit**: 10MB maximum
3. **File Type Validation**: Only CSV and XML allowed
4. **Input Sanitization**: All fields validated and sanitized
5. **Duplicate Prevention**: Email uniqueness enforced
6. **Error Messages**: Don't expose sensitive system information

## Performance Considerations

1. **Memory Storage**: Files stored in memory for parsing (10MB limit)
2. **Batch Processing**: All entries processed in single request
3. **Database Queries**: Optimized duplicate checking with single query
4. **Large Files**: Recommend splitting files >1000 entries

## Testing Recommendations

### Unit Tests
- File parsing functions
- Validation functions
- Error handling

### Integration Tests
- Full upload flow
- Duplicate detection
- Error reporting

### E2E Tests
- User upload workflow
- Results display
- Error scenarios

## Future Enhancements

1. **Async Processing**: Queue-based processing for large files
2. **Progress Updates**: Real-time upload progress via WebSocket
3. **Partial Retry**: Re-upload only failed entries
4. **Export Failed**: Download failed entries as CSV
5. **Template Validation**: Pre-upload file structure validation
6. **Batch Size Limits**: Configurable entry limits per upload
7. **Audit Logging**: Track who uploaded what and when
8. **Rollback**: Ability to undo bulk uploads

## Troubleshooting

### Common Issues

**Issue**: Upload fails with "Invalid file type"
**Solution**: Ensure file has .csv or .xml extension

**Issue**: All entries fail validation
**Solution**: Check file format matches template exactly

**Issue**: Duplicate email errors
**Solution**: Remove duplicates from file or database

**Issue**: Phone validation fails
**Solution**: Use international format (+1234567890)

## Maintenance

### Monitoring
- Track upload success rates
- Monitor file sizes
- Log validation errors
- Track duplicate rates

### Updates
- Keep dependencies updated
- Review validation rules periodically
- Update sample templates as needed
- Monitor user feedback

## Support

For technical issues:
1. Check browser console for errors
2. Review backend logs
3. Verify file format
4. Test with sample files
5. Contact development team

