# Bulk Upload Clients & Staff - Technical Documentation

## Overview
This document provides technical details about the Bulk Upload feature for Clients and Staff in the SoActiv gym management system.

## Architecture

### Backend Components

#### 1. Controllers
- **Location**: `be/controllers/client.bulk.controllers.ts`
- **Location**: `be/controllers/staff.bulk.controllers.ts`
- **Purpose**: Handle bulk upload logic, validation, and database operations

**Key Functions:**
- `bulkUploadClients(req, res)` - Process client bulk uploads
- `bulkUploadStaff(req, res)` - Process staff bulk uploads

**Workflow:**
1. Authenticate user via JWT middleware
2. Validate file upload (type, size)
3. Parse CSV or XML content
4. Validate each entry against schema
5. Check for duplicate emails/phones
6. Insert valid entries into database
7. Return detailed results report

#### 2. Middleware
- **Location**: `be/middlewares/upload.middleware.ts`
- **Purpose**: Handle file uploads using Multer

**Configuration:**
```typescript
export const bulkUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: bulkUploadFileFilter, // CSV/XML only
});
```

#### 3. Routes
- **Location**: `be/routes/client.routes.ts`
- **Location**: `be/routes/staff.routes.ts`

**Endpoints:**
```typescript
POST /api/v1/client/bulk-upload
POST /api/v1/staff/bulk-upload
```

**Middleware Chain:**
1. `authMiddleware` - JWT authentication
2. `bulkUpload.single('file')` - File upload handling
3. `bulkUploadClients` or `bulkUploadStaff` - Business logic

### Frontend Components

#### 1. Hooks
- **Location**: `fe/src/hooks/useClient.tsx`
- **Location**: `fe/src/hooks/useStaff.tsx`

**New Functions:**
```typescript
bulkUpload: (file: File) => Promise<BulkUploadResult | null>
```

**Implementation:**
- Creates FormData with file
- Sends POST request to bulk upload endpoint
- Refreshes data on success
- Returns result for UI display

#### 2. Components

**BulkUploadModal** (`fe/src/components/common/BulkUploadModal.tsx`)
- Reusable modal for both clients and staff
- Accepts `type` prop: 'client' | 'staff'
- Features:
  - Drag-and-drop file upload
  - File type validation (CSV/XML only)
  - File size validation (max 10MB)
  - Sample file downloads
  - Type-specific field requirements
  - Upload progress indicator

**UploadResultsReport** (`fe/src/components/common/UploadResultsReport.tsx`)
- Displays detailed upload results
- Features:
  - Summary statistics cards
  - Success rate progress bar
  - Expandable successful entries table
  - Expandable failed entries with error details
  - Row-by-row error highlighting

#### 3. Pages
- **Location**: `fe/src/pages/admin/ClientsPage.tsx`
- **Location**: `fe/src/pages/admin/StaffPage.tsx`

**Integration:**
- Added "Bulk Upload" button
- State management for modals
- Handler for bulk upload process
- Results display

---

## Data Flow

### Upload Process

```
User selects file
    ↓
BulkUploadModal validates file (type, size)
    ↓
User clicks "Upload"
    ↓
Frontend: bulkUpload(file) called
    ↓
FormData created with file
    ↓
POST request to /api/v1/{client|staff}/bulk-upload
    ↓
Backend: authMiddleware validates JWT
    ↓
Backend: multer processes file upload
    ↓
Backend: Controller parses CSV/XML
    ↓
Backend: Validates each entry
    ↓
Backend: Checks for duplicates
    ↓
Backend: Inserts valid entries to MongoDB
    ↓
Backend: Returns BulkUploadResult
    ↓
Frontend: Displays results in UploadResultsReport
    ↓
Frontend: Refreshes client/staff list
```

---

## File Parsing

### CSV Parsing
- **Library**: PapaParse
- **Configuration**:
  ```typescript
  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ''),
  });
  ```
- **Header Transformation**: Removes spaces, converts to lowercase

### XML Parsing
- **Method**: Custom regex-based parser
- **Pattern**: `/<(?:client|staff|entry)>([\s\S]*?)<\/(?:client|staff|entry)>/gi`
- **Field Extraction**: `/<(\w+)>(.*?)<\/\1>/g`
- **Advantages**: No external dependencies, lightweight

---

## Validation

### Client Validation Rules

```typescript
interface ClientValidation {
  fullName: string; // min 2 chars
  email: string; // valid format, unique
  contactNumber: string; // valid format, unique
  gender: 'male' | 'female' | 'other';
  startDate: Date;
  endDate: Date;
  packagePrice: number; // >= 0
  plan: 'basic' | 'premium';
  timing: string;
  status?: 'active' | 'expired' | 'pending'; // default: 'active'
  hasPersonalTraining?: boolean; // default: false
  personalTrainingDurationWeeks?: number; // > 0 if PT enabled
  personalTrainingPrice?: number; // >= 0 if PT enabled
}
```

### Staff Validation Rules

```typescript
interface StaffValidation {
  fullName: string; // min 2 chars
  email: string; // valid format, unique
  contactNumber: string; // valid format, unique
  position: string;
  joiningDate: Date;
  salary: number; // >= 0
  status?: 'active' | 'inactive'; // default: 'active'
  notifications?: {
    sms: boolean; // default: true
    email: boolean; // default: true
    push: boolean; // default: true
    whatsapp: boolean; // default: true
  };
}
```

### Validation Functions

```typescript
// Email validation
const isValidEmail = (email: string): boolean => {
  return /^\S+@\S+\.\S+$/.test(email);
};

// Phone validation
const isValidPhone = (phone: string): boolean => {
  return /^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone);
};
```

---

## Duplicate Detection

### Strategy
1. **Database Level**: Fetch existing emails and phones
2. **Batch Level**: Track emails/phones within current upload
3. **Dual Check**: Prevent duplicates from both sources

### Implementation

```typescript
// Fetch existing data
const existingClients = await Client.find({ userId }, 'email contactNumber');
const existingEmails = new Set(existingClients.map(c => c.email.toLowerCase()));
const existingPhones = new Set(existingClients.map(c => c.contactNumber));

// Track batch data
const batchEmails = new Set<string>();
const batchPhones = new Set<string>();

// Check for duplicates
if (existingEmails.has(email) || batchEmails.has(email)) {
  // Reject as duplicate
}
```

---

## Response Format

### BulkUploadResult Interface

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
    successful: Array<{
      row: number;
      fullName: string;
      email: string;
      contactNumber?: string; // for clients
      position?: string; // for staff
    }>;
    failed: Array<{
      row: number;
      data: any;
      reason: string;
      errors: string[];
    }>;
  };
}
```

### Example Response

```json
{
  "success": true,
  "message": "Bulk upload completed",
  "summary": {
    "total": 30,
    "successful": 28,
    "failed": 2,
    "duplicates": 1
  },
  "details": {
    "successful": [
      {
        "row": 2,
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "contactNumber": "+1234567890"
      }
    ],
    "failed": [
      {
        "row": 5,
        "data": { "fullName": "Jane Smith", "email": "invalid-email" },
        "reason": "Validation failed",
        "errors": ["Valid email is required"]
      }
    ]
  }
}
```

---

## Error Handling

### Backend Errors

1. **Authentication Error** (401)
   ```json
   {
     "success": false,
     "message": "Unauthorized: User not authenticated"
   }
   ```

2. **No File Uploaded** (400)
   ```json
   {
     "success": false,
     "message": "No file uploaded"
   }
   ```

3. **Invalid File Type** (400)
   ```json
   {
     "success": false,
     "message": "Invalid file type. Only CSV and XML are supported."
   }
   ```

4. **Empty File** (400)
   ```json
   {
     "success": false,
     "message": "No valid data found in the uploaded file"
   }
   ```

5. **Server Error** (500)
   ```json
   {
     "success": false,
     "message": "Server error during bulk upload",
     "error": "Error details"
   }
   ```

### Frontend Error Handling

```typescript
const handleBulkUpload = async (file: File) => {
  const result = await bulkUpload(file);
  if (result) {
    setUploadResult(result);
    setIsBulkUploadModalOpen(false);
    setIsResultsModalOpen(true);
    
    if (result.summary.successful > 0) {
      // Show success notification
    }
  }
  return result;
};
```

---

## Security Considerations

1. **Authentication**: JWT-based authentication required
2. **File Size Limit**: 10MB maximum to prevent DoS
3. **File Type Validation**: Only CSV and XML allowed
4. **Input Sanitization**: All fields validated before database insertion
5. **User Isolation**: Data scoped to authenticated user's ID
6. **Duplicate Prevention**: Email and phone uniqueness enforced

---

## Performance Optimization

1. **Memory Storage**: Files processed in memory (no disk I/O)
2. **Batch Processing**: All entries processed in single database operation
3. **Set Data Structure**: O(1) duplicate checking
4. **Selective Field Fetching**: Only email/phone fetched for duplicate check
5. **Client-Side Validation**: File type/size checked before upload

---

## Testing Recommendations

### Unit Tests
- CSV parsing with various formats
- XML parsing with various structures
- Validation functions for each field
- Duplicate detection logic
- Error handling scenarios

### Integration Tests
- End-to-end upload flow
- Authentication middleware
- Database operations
- File upload middleware

### Manual Testing
- Upload sample CSV files
- Upload sample XML files
- Test with invalid data
- Test with duplicate entries
- Test with large files (near 10MB limit)
- Test with various file encodings

---

## Future Enhancements

1. **Progress Tracking**: Real-time upload progress
2. **Async Processing**: Background job for large files
3. **Email Notifications**: Notify user when upload completes
4. **Partial Success**: Option to commit partial results
5. **Data Preview**: Show parsed data before upload
6. **Template Generator**: Generate custom templates
7. **Undo Feature**: Rollback recent bulk uploads
8. **Audit Logging**: Track who uploaded what and when

---

## Dependencies

### Backend
- `express` - Web framework
- `multer` - File upload handling
- `papaparse` - CSV parsing
- `mongoose` - MongoDB ODM

### Frontend
- `react` - UI framework
- `lucide-react` - Icons
- Custom UI components (Modal, Button, etc.)

---

## File Structure

```
be/
├── controllers/
│   ├── client.bulk.controllers.ts
│   └── staff.bulk.controllers.ts
├── middlewares/
│   └── upload.middleware.ts
├── routes/
│   ├── client.routes.ts
│   └── staff.routes.ts
└── models/
    ├── client.model.ts
    └── staff.model.ts

fe/
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── BulkUploadModal.tsx
│   │       └── UploadResultsReport.tsx
│   ├── hooks/
│   │   ├── useClient.tsx
│   │   └── useStaff.tsx
│   └── pages/
│       └── admin/
│           ├── ClientsPage.tsx
│           └── StaffPage.tsx
└── doc/
    ├── BULK_UPLOAD_CLIENTS_STAFF_GUIDE.md
    └── BULK_UPLOAD_CLIENTS_STAFF_FEATURE.md

sample_clients.csv
sample_clients.xml
sample_staff.csv
sample_staff.xml
```

