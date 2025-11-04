# Bulk Upload Feature - Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend running on `http://localhost:5173`
3. User logged in with valid credentials
4. MongoDB connected and running

### Test Files

#### Test CSV File 1: Valid Entries
Create a file named `test_valid.csv`:
```csv
name,phone,email,source,status,comments,interests,budget,followUpDate
John Doe,+1234567890,john.doe@example.com,website,new,Interested in premium membership,Weight training,500-1000,2025-12-01
Jane Smith,+1987654321,jane.smith@example.com,referral,contacted,Follow up next week,Yoga and cardio,300-500,2025-12-05
Mike Johnson,+1122334455,mike.johnson@example.com,walk-in,interested,Ready to sign up,CrossFit,1000-1500,2025-12-03
Sarah Williams,+1555666777,sarah.williams@example.com,social-media,new,Wants group classes,Pilates,200-400,2025-12-10
```

#### Test CSV File 2: Mixed Valid/Invalid
Create a file named `test_mixed.csv`:
```csv
name,phone,email,source,status,comments,interests,budget,followUpDate
Valid User,+1234567890,valid@example.com,website,new,This is valid,Gym,500,2025-12-01
,+1987654321,noemail@example.com,website,new,Missing name,Cardio,300,2025-12-02
Invalid Phone,123456,badphone@example.com,website,new,Bad phone format,Weights,400,2025-12-03
Bad Source,+1555666777,badsource@example.com,invalid-source,new,Invalid source,Yoga,500,2025-12-04
Bad Email,+1444555666,not-an-email,website,new,Invalid email format,Running,600,2025-12-05
```

#### Test CSV File 3: Duplicates
Create a file named `test_duplicates.csv`:
```csv
name,phone,email,source,status,comments,interests,budget,followUpDate
First User,+1111111111,duplicate@example.com,website,new,First entry,Gym,500,2025-12-01
Second User,+2222222222,duplicate@example.com,referral,new,Duplicate email,Cardio,600,2025-12-02
Third User,+3333333333,unique@example.com,walk-in,new,Unique email,Weights,700,2025-12-03
```

#### Test XML File 1: Valid Entries
Create a file named `test_valid.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<enquiries>
  <enquiry>
    <name>John Doe</name>
    <phone>+1234567890</phone>
    <email>john.xml@example.com</email>
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
    <email>jane.xml@example.com</email>
    <source>referral</source>
    <status>contacted</status>
    <comments>Follow up next week</comments>
    <interests>Yoga and cardio</interests>
    <budget>300-500</budget>
    <followUpDate>2025-12-05</followUpDate>
  </enquiry>
</enquiries>
```

#### Test XML File 2: Mixed Valid/Invalid
Create a file named `test_mixed.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<enquiries>
  <enquiry>
    <name>Valid User</name>
    <phone>+1234567890</phone>
    <email>valid.xml@example.com</email>
    <source>website</source>
    <status>new</status>
  </enquiry>
  <enquiry>
    <name></name>
    <phone>+1987654321</phone>
    <email>noname@example.com</email>
    <source>website</source>
    <status>new</status>
  </enquiry>
  <enquiry>
    <name>Bad Phone</name>
    <phone>123456</phone>
    <email>badphone.xml@example.com</email>
    <source>website</source>
    <status>new</status>
  </enquiry>
</enquiries>
```

## Test Scenarios

### Scenario 1: Upload Valid CSV
**Steps:**
1. Navigate to Enquiries page
2. Click "Bulk Upload" button
3. Select or drag `test_valid.csv`
4. Click "Upload"

**Expected Result:**
- All 4 entries should be successful
- Summary shows: Total: 4, Successful: 4, Failed: 0, Duplicates: 0
- Success rate: 100%
- All entries appear in successful list

### Scenario 2: Upload Valid XML
**Steps:**
1. Click "Bulk Upload" button
2. Select or drag `test_valid.xml`
3. Click "Upload"

**Expected Result:**
- All 2 entries should be successful
- Summary shows: Total: 2, Successful: 2, Failed: 0, Duplicates: 0
- Success rate: 100%

### Scenario 3: Upload Mixed CSV
**Steps:**
1. Click "Bulk Upload" button
2. Select or drag `test_mixed.csv`
3. Click "Upload"

**Expected Result:**
- Summary shows: Total: 5, Successful: 1, Failed: 4
- Failed entries show specific errors:
  - Row 2: "Name is required"
  - Row 3: "Invalid phone number format"
  - Row 4: "Invalid source"
  - Row 5: "Invalid email format"

### Scenario 4: Upload Duplicates
**Steps:**
1. Upload `test_duplicates.csv` first time
2. Upload same file again

**Expected Result (First Upload):**
- Summary shows: Total: 3, Successful: 2, Failed: 1, Duplicates: 1
- Row 2 fails with "Duplicate email" (duplicate within file)

**Expected Result (Second Upload):**
- Summary shows: Total: 3, Successful: 0, Failed: 3, Duplicates: 2
- Rows 1 and 2 fail with "Duplicate email" (already in database)

### Scenario 5: Invalid File Type
**Steps:**
1. Click "Bulk Upload" button
2. Try to upload a .txt or .pdf file

**Expected Result:**
- File is rejected
- Alert: "Please select a CSV or XML file"

### Scenario 6: File Too Large
**Steps:**
1. Create a CSV file larger than 10MB
2. Try to upload it

**Expected Result:**
- File is rejected
- Alert: "File size must be less than 10MB"

### Scenario 7: Download Sample Files
**Steps:**
1. Click "Bulk Upload" button
2. Click "Download CSV Sample"
3. Click "Download XML Sample"

**Expected Result:**
- Both sample files download successfully
- Files contain properly formatted example data

### Scenario 8: Drag and Drop
**Steps:**
1. Click "Bulk Upload" button
2. Drag a CSV file over the upload area
3. Drop the file

**Expected Result:**
- Upload area highlights when dragging
- File is selected after drop
- File details display correctly

### Scenario 9: Empty File
**Steps:**
1. Create a CSV with only headers (no data rows)
2. Upload the file

**Expected Result:**
- Error: "No valid data found in the uploaded file"

### Scenario 10: Special Characters
Create `test_special.csv`:
```csv
name,phone,email,source,status,comments,interests,budget,followUpDate
"O'Brien, John",+1234567890,obrien@example.com,website,new,"Wants to join in January, 2025",Cardio & Weights,500-1000,2025-01-15
```

**Expected Result:**
- Entry should be successful
- Special characters handled correctly

## Manual Testing Checklist

### File Upload
- [ ] CSV file upload works
- [ ] XML file upload works
- [ ] Drag and drop works
- [ ] File browser selection works
- [ ] Invalid file types rejected
- [ ] Large files rejected (>10MB)
- [ ] File details display correctly

### Validation
- [ ] Missing name detected
- [ ] Missing phone detected
- [ ] Missing source detected
- [ ] Invalid email format detected
- [ ] Invalid phone format detected
- [ ] Invalid source value detected
- [ ] Invalid status value detected
- [ ] Field length limits enforced

### Duplicate Detection
- [ ] Duplicate emails in database detected
- [ ] Duplicate emails within file detected
- [ ] Duplicates counted separately in summary

### Results Display
- [ ] Summary statistics correct
- [ ] Success rate calculated correctly
- [ ] Successful entries list accurate
- [ ] Failed entries list accurate
- [ ] Error messages clear and specific
- [ ] Row numbers match file

### User Experience
- [ ] Upload modal opens/closes correctly
- [ ] Results modal opens/closes correctly
- [ ] Sample downloads work
- [ ] Instructions clear
- [ ] Loading states show during upload
- [ ] Enquiry list refreshes after upload

## API Testing with cURL

### Test Bulk Upload Endpoint
```bash
# Upload CSV file
curl -X POST http://localhost:8000/api/v1/enquiry/bulk-upload \
  -H "Cookie: accessToken=YOUR_TOKEN_HERE" \
  -F "file=@test_valid.csv"

# Upload XML file
curl -X POST http://localhost:8000/api/v1/enquiry/bulk-upload \
  -H "Cookie: accessToken=YOUR_TOKEN_HERE" \
  -F "file=@test_valid.xml"
```

### Expected Response Format
```json
{
  "success": true,
  "message": "Bulk upload completed",
  "summary": {
    "total": 4,
    "successful": 3,
    "failed": 1,
    "duplicates": 0
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

## Browser Console Testing

### Check Network Requests
1. Open browser DevTools (F12)
2. Go to Network tab
3. Upload a file
4. Check the request:
   - Method: POST
   - URL: `/api/v1/enquiry/bulk-upload`
   - Content-Type: multipart/form-data
   - Response status: 200

### Check Console Errors
- No errors should appear in console
- Check for any warnings

## Database Verification

### Check MongoDB
```javascript
// Connect to MongoDB
use soActive

// Count enquiries before upload
db.enquiries.countDocuments()

// Upload file

// Count enquiries after upload
db.enquiries.countDocuments()

// View recent enquiries
db.enquiries.find().sort({createdAt: -1}).limit(5)

// Check for specific email
db.enquiries.findOne({email: "john@example.com"})
```

## Performance Testing

### Large File Test
1. Create CSV with 1000 entries
2. Upload and measure time
3. Check memory usage
4. Verify all entries processed

### Concurrent Uploads
1. Open multiple browser tabs
2. Upload different files simultaneously
3. Verify all uploads complete successfully

## Error Scenarios

### Test Error Handling
1. **Server Down**: Stop backend, try upload
2. **Database Down**: Stop MongoDB, try upload
3. **Network Error**: Simulate slow/failed connection
4. **Invalid Token**: Clear cookies, try upload

## Regression Testing

After any code changes, verify:
- [ ] Existing enquiry creation still works
- [ ] Enquiry list display unchanged
- [ ] Edit/delete enquiries still works
- [ ] No performance degradation
- [ ] No new console errors

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus indicators visible
- [ ] Error messages announced

## Cross-Browser Testing

Test in:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile Testing

- [ ] Upload works on mobile
- [ ] Modals display correctly
- [ ] Touch interactions work
- [ ] Responsive layout

## Security Testing

- [ ] Unauthenticated requests rejected
- [ ] File type validation enforced
- [ ] File size limits enforced
- [ ] SQL injection attempts fail
- [ ] XSS attempts sanitized

## Reporting Issues

When reporting bugs, include:
1. Test scenario being run
2. Expected result
3. Actual result
4. Browser/OS information
5. Console errors (if any)
6. Network request details
7. Sample file used (if applicable)

## Success Criteria

Feature is ready for production when:
- [ ] All test scenarios pass
- [ ] No critical bugs found
- [ ] Performance acceptable (<5s for 1000 entries)
- [ ] Error messages clear and helpful
- [ ] Documentation complete
- [ ] Code reviewed and approved

