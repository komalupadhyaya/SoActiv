# Bulk Upload Clients & Staff - User Guide

## Overview
The Bulk Upload feature allows you to quickly add multiple clients or staff members to your SoActiv gym management system by uploading CSV or XML files.

## Supported File Formats
- **CSV** (Comma-Separated Values)
- **XML** (Extensible Markup Language)

**Maximum file size:** 10MB

---

## How to Use Bulk Upload

### For Clients

1. **Navigate to Clients Page**
   - Go to the Clients section in your admin dashboard

2. **Click "Bulk Upload" Button**
   - Located next to the "Add New Client" button

3. **Prepare Your File**
   - Download a sample CSV or XML file from the modal
   - Fill in your client data following the format

4. **Upload Your File**
   - Drag and drop your file into the upload area, OR
   - Click "browse to upload" to select your file

5. **Review Results**
   - After upload, you'll see a detailed report showing:
     - Total entries processed
     - Successful additions
     - Failed entries with reasons
     - Duplicate entries detected

### For Staff

1. **Navigate to Staff Page**
   - Go to the Staff section in your admin dashboard

2. **Click "Bulk Upload" Button**
   - Located next to the "Add New Staff" button

3. **Prepare Your File**
   - Download a sample CSV or XML file from the modal
   - Fill in your staff data following the format

4. **Upload Your File**
   - Drag and drop your file into the upload area, OR
   - Click "browse to upload" to select your file

5. **Review Results**
   - After upload, you'll see a detailed report showing:
     - Total entries processed
     - Successful additions
     - Failed entries with reasons
     - Duplicate entries detected

---

## Required Fields

### For Clients
- **fullName** - Full name of the client (minimum 2 characters)
- **email** - Valid email address (must be unique)
- **contactNumber** - Phone number in international format (must be unique)
- **gender** - Must be: `male`, `female`, or `other`
- **startDate** - Membership start date (YYYY-MM-DD format)
- **endDate** - Membership end date (YYYY-MM-DD format)
- **packagePrice** - Package price (must be >= 0)
- **plan** - Must be: `basic` or `premium`
- **timing** - Preferred timing (e.g., "Morning (6AM-10AM)")

### For Staff
- **fullName** - Full name of the staff member (minimum 2 characters)
- **position** - Job position/role
- **email** - Valid email address (must be unique)
- **contactNumber** - Phone number in international format (must be unique)
- **joiningDate** - Date of joining (YYYY-MM-DD format)
- **salary** - Salary amount (must be >= 0)

---

## Optional Fields

### For Clients
- **status** - `active`, `expired`, or `pending` (default: `active`)
- **hasPersonalTraining** - `true` or `false` (default: `false`)
- **personalTrainingDurationWeeks** - Number of weeks (required if hasPersonalTraining is true)
- **personalTrainingPrice** - Price for personal training (required if hasPersonalTraining is true)
- **dateOfBirth** - Date of birth (YYYY-MM-DD format)
- **address** - Full address
- **emergencyContactName** - Emergency contact person's name
- **emergencyContactNumber** - Emergency contact phone number
- **emergencyContactRelation** - Relationship (e.g., `spouse`, `parent`, `sibling`)
- **attendanceId** - Attendance ID
- **clubId** - Club ID
- **gstNo** - GST number

### For Staff
- **status** - `active` or `inactive` (default: `active`)
- **notificationSMS** - `true` or `false` (default: `true`)
- **notificationEmail** - `true` or `false` (default: `true`)
- **notificationPush** - `true` or `false` (default: `true`)
- **notificationWhatsApp** - `true` or `false` (default: `true`)

---

## CSV Format Examples

### Client CSV Example
```csv
fullName,email,contactNumber,gender,startDate,endDate,packagePrice,plan,timing,status,hasPersonalTraining
John Doe,john.doe@example.com,+1234567890,male,2025-01-01,2025-12-31,5000,premium,Morning (6AM-10AM),active,true
Sarah Smith,sarah.smith@example.com,+1987654321,female,2025-01-15,2025-07-15,3000,basic,Evening (5PM-9PM),active,false
```

### Staff CSV Example
```csv
fullName,position,email,contactNumber,joiningDate,salary,status
John Trainer,Personal Trainer,john.trainer@example.com,+1234567890,2024-01-15,45000,active
Sarah Manager,Gym Manager,sarah.manager@example.com,+1987654321,2023-06-01,55000,active
```

---

## XML Format Examples

### Client XML Example
```xml
<?xml version="1.0" encoding="UTF-8"?>
<clients>
  <client>
    <fullName>John Doe</fullName>
    <email>john.doe@example.com</email>
    <contactNumber>+1234567890</contactNumber>
    <gender>male</gender>
    <startDate>2025-01-01</startDate>
    <endDate>2025-12-31</endDate>
    <packagePrice>5000</packagePrice>
    <plan>premium</plan>
    <timing>Morning (6AM-10AM)</timing>
    <status>active</status>
    <hasPersonalTraining>true</hasPersonalTraining>
  </client>
</clients>
```

### Staff XML Example
```xml
<?xml version="1.0" encoding="UTF-8"?>
<staff>
  <staff>
    <fullName>John Trainer</fullName>
    <position>Personal Trainer</position>
    <email>john.trainer@example.com</email>
    <contactNumber>+1234567890</contactNumber>
    <joiningDate>2024-01-15</joiningDate>
    <salary>45000</salary>
    <status>active</status>
  </staff>
</staff>
```

---

## Validation Rules

### Email Validation
- Must be in valid email format (e.g., user@example.com)
- Must be unique (no duplicates in the system)
- Case-insensitive

### Phone Number Validation
- Must be at least 10 characters
- Can include: `+`, digits, spaces, hyphens, parentheses
- Must be unique (no duplicates in the system)
- Recommended format: International format (e.g., +1234567890)

### Date Format
- Must be in YYYY-MM-DD format
- Example: 2025-01-15

### Numeric Fields
- Package price and salary must be >= 0
- Personal training duration must be > 0 (if personal training is enabled)

---

## Error Handling

### Common Errors

1. **Duplicate Email**
   - Error: "Email already exists in the system"
   - Solution: Use a unique email address

2. **Duplicate Phone**
   - Error: "Contact number already exists in the system"
   - Solution: Use a unique phone number

3. **Invalid Email Format**
   - Error: "Valid email is required"
   - Solution: Ensure email follows format: user@domain.com

4. **Invalid Phone Format**
   - Error: "Valid contact number is required"
   - Solution: Use international format with at least 10 characters

5. **Missing Required Fields**
   - Error: "Field X is required"
   - Solution: Ensure all required fields are filled

6. **Invalid Enum Values**
   - Error: "Gender must be male, female, or other"
   - Solution: Use only allowed values

### Viewing Failed Entries
- Failed entries are shown in the results report
- Each failed entry includes:
  - Row number in the original file
  - Specific error messages
  - Original data for reference

---

## Best Practices

1. **Test with Small Batches First**
   - Upload 5-10 entries initially to verify format
   - Once successful, upload larger batches

2. **Use Sample Files**
   - Download and modify the provided sample files
   - This ensures correct format and field names

3. **Check for Duplicates**
   - Verify emails and phone numbers are unique
   - The system will reject duplicate entries

4. **Validate Data Before Upload**
   - Ensure dates are in YYYY-MM-DD format
   - Verify numeric fields contain valid numbers
   - Check that enum fields use allowed values

5. **Keep Backup**
   - Save a copy of your original file
   - Useful for troubleshooting if issues occur

6. **Review Results Report**
   - Always check the results after upload
   - Fix any failed entries and re-upload if needed

---

## Tips for Success

- **Column Headers**: Must match exactly (case-insensitive, spaces removed)
- **Empty Values**: Leave optional fields empty if not needed
- **Boolean Values**: Use `true` or `false` (lowercase)
- **File Encoding**: Use UTF-8 encoding for best compatibility
- **Line Breaks**: Ensure proper line breaks between entries

---

## Support

If you encounter issues:
1. Check the error messages in the results report
2. Verify your file format matches the samples
3. Ensure all required fields are present
4. Contact your system administrator for assistance

---

## Sample Files

Sample files are available for download directly from the Bulk Upload modal:
- `sample_clients.csv` - 30 sample client entries
- `sample_clients.xml` - 15 sample client entries
- `sample_staff.csv` - 30 sample staff entries
- `sample_staff.xml` - 15 sample staff entries

You can also find these files in the project root directory.

