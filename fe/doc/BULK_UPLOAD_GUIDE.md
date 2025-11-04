# Bulk Upload Enquiries - User Guide

## Overview
The Bulk Upload feature allows you to import multiple enquiries at once using CSV or XML files. This is useful for migrating data from other systems or adding multiple enquiries efficiently.

## Supported File Formats
- **CSV** (Comma-Separated Values)
- **XML** (Extensible Markup Language)

## File Requirements

### General Requirements
- Maximum file size: **10MB**
- File encoding: **UTF-8** (recommended)

### Required Fields
The following fields are **mandatory** for each enquiry:
- `name` - Customer's full name (max 100 characters)
- `phone` - Phone number in international format (e.g., +1234567890)
- `source` - How the enquiry came in

### Optional Fields
- `email` - Customer's email address (must be valid format if provided)
- `status` - Current status of the enquiry
- `comments` - Additional notes (max 1000 characters)
- `interests` - Customer's interests (max 500 characters)
- `budget` - Budget range (max 100 characters)
- `followUpDate` - Date for follow-up (format: YYYY-MM-DD)

### Valid Values

#### Source (required)
Must be one of:
- `website`
- `social-media`
- `referral`
- `walk-in`
- `advertisement`
- `other`

#### Status (optional, defaults to 'new')
Must be one of:
- `new`
- `contacted`
- `interested`
- `converted`
- `lost`

## CSV Format

### CSV Template
```csv
name,phone,email,source,status,comments,interests,budget,followUpDate
John Doe,+1234567890,john@example.com,website,new,Interested in premium membership,Weight training,500-1000,2025-12-01
Jane Smith,+1987654321,jane@example.com,referral,contacted,Follow up next week,Yoga and cardio,300-500,2025-12-05
Mike Johnson,+1122334455,mike@example.com,walk-in,interested,Ready to sign up,CrossFit,1000-1500,2025-12-03
```

### CSV Guidelines
1. First row must contain column headers
2. Headers are case-insensitive and spaces are ignored
3. Use commas to separate values
4. Enclose values containing commas in double quotes
5. Empty optional fields can be left blank

### CSV Example with Special Characters
```csv
name,phone,email,source,status,comments,interests,budget,followUpDate
"Smith, John",+1234567890,john.smith@example.com,website,new,"Wants to join in January, 2025",Cardio,500-1000,2025-01-15
```

## XML Format

### XML Template
```xml
<?xml version="1.0" encoding="UTF-8"?>
<enquiries>
  <enquiry>
    <name>John Doe</name>
    <phone>+1234567890</phone>
    <email>john@example.com</email>
    <source>website</source>
    <status>new</status>
    <comments>Interested in premium membership</comments>
    <interests>Weight training</interests>
    <budget>500-1000</budget>
    <followUpDate>2025-12-01</followUpDate>
  </enquiry>
  <enquiry>
    <name>Jane Smith</name>
    <phone>+1987654321</phone>
    <email>jane@example.com</email>
    <source>referral</source>
    <status>contacted</status>
    <comments>Follow up next week</comments>
    <interests>Yoga and cardio</interests>
    <budget>300-500</budget>
    <followUpDate>2025-12-05</followUpDate>
  </enquiry>
</enquiries>
```

### XML Guidelines
1. Root element must be `<enquiries>`
2. Each entry must be wrapped in `<enquiry>` or `<entry>` tags
3. Field names are case-insensitive
4. Empty optional fields can be omitted or left as empty tags
5. Special characters should be properly escaped

## Validation Rules

### Email Validation
- Must be a valid email format (e.g., user@domain.com)
- **Duplicate emails are automatically rejected**
- If an email already exists in the system, that entry will be skipped

### Phone Validation
- Must be in international format
- Should start with + followed by country code
- Example: +1234567890, +919876543210

### Data Length Limits
- Name: 100 characters
- Comments: 1000 characters
- Interests: 500 characters
- Budget: 100 characters

## Upload Process

1. **Click "Bulk Upload" button** on the Enquiries page
2. **Select or drag-and-drop** your CSV or XML file
3. **Review file details** before uploading
4. **Click "Upload"** to process the file
5. **View results report** showing:
   - Total entries processed
   - Successful imports
   - Failed entries with error details
   - Duplicate emails detected

## Error Handling

### Common Errors and Solutions

#### "Name is required"
- **Cause**: Name field is empty
- **Solution**: Ensure every entry has a name

#### "Invalid phone number format"
- **Cause**: Phone number doesn't match international format
- **Solution**: Use format like +1234567890

#### "Invalid email format"
- **Cause**: Email doesn't match standard format
- **Solution**: Use format like user@domain.com

#### "Duplicate email"
- **Cause**: Email already exists in the system
- **Solution**: Remove or update the email address

#### "Invalid source"
- **Cause**: Source value is not in the allowed list
- **Solution**: Use one of: website, social-media, referral, walk-in, advertisement, other

#### "Invalid status"
- **Cause**: Status value is not in the allowed list
- **Solution**: Use one of: new, contacted, interested, converted, lost

## Upload Results Report

After upload, you'll see a detailed report with:

### Summary Statistics
- **Total**: Number of entries in the file
- **Successful**: Entries successfully added
- **Failed**: Entries that couldn't be added
- **Duplicates**: Entries with duplicate emails

### Detailed Results
- **Successful Entries**: List of all successfully imported enquiries
- **Failed Entries**: Detailed error messages for each failed entry
  - Row number in the original file
  - Reason for failure
  - Specific validation errors

## Best Practices

1. **Test with small files first** - Upload a few entries to verify format
2. **Clean your data** - Remove duplicates before uploading
3. **Use sample templates** - Download provided CSV/XML samples
4. **Validate emails** - Ensure all emails are properly formatted
5. **Check phone numbers** - Use international format consistently
6. **Review results** - Always check the upload report for errors
7. **Keep backups** - Save your original files before uploading

## Tips for Large Uploads

1. **Split large files** - Break files into smaller batches (e.g., 500-1000 entries)
2. **Monitor progress** - Watch for any patterns in failed entries
3. **Fix and retry** - Correct errors and re-upload failed entries
4. **Avoid duplicates** - The system will skip duplicate emails automatically

## Troubleshooting

### File Won't Upload
- Check file size (must be under 10MB)
- Verify file extension (.csv or .xml)
- Ensure file is not corrupted

### All Entries Failed
- Verify file format matches template
- Check that headers are correct (CSV)
- Ensure XML structure is valid

### Some Entries Failed
- Review error messages in the results report
- Fix validation issues in your source file
- Re-upload only the failed entries

## Support

If you encounter issues not covered in this guide:
1. Check the error messages in the upload results
2. Verify your file matches the provided templates
3. Contact system administrator for assistance

## Sample Files

Sample files are available for download directly from the Bulk Upload modal:
- **CSV Sample**: Click "Download CSV Sample"
- **XML Sample**: Click "Download XML Sample"

These samples include properly formatted example data that you can use as a starting point for your own uploads.

