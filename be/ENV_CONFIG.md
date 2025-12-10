# Environment Configuration for Staff Auto-Registration

## Required Environment Variables

Add the following variables to your `.env` file in the `be` directory:

```env
# Resend Email Service
RESEND_API_KEY=re_QZzbeWEq_2dfRZwoENFCv3mauYaNocp59
EMAIL_FROM=SoActiv <noreply@yourdomain.com>

# Application URL (for login links in emails)
APP_URL=http://localhost:5173

# Existing variables (keep these as is)
ACCESS_TOKEN_SECRET=your-secret-key
MONGODB_URI=your-mongodb-connection-string
```

## Configuration Notes

1. **RESEND_API_KEY**: Your Resend API key for sending emails
2. **EMAIL_FROM**: The "from" address that appears in emails (must be verified in Resend)
3. **APP_URL**: The frontend URL where staff members will log in

## Testing Email Delivery

1. Create a new staff member via the admin panel
2. Check the email inbox for the welcome email
3. Verify the login credentials work
4. Test the login link in the email

## Security Considerations

- Passwords are automatically hashed before storage
- Generated passwords are 12 characters with mixed case, numbers, and special characters
- Emails are sent via TLS-encrypted connection through Resend
- Consider implementing "force password change on first login" for enhanced security
