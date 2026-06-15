/**
 * Email Sender Utility using Nodemailer (SMTP)
 * Handles sending welcome emails to newly created staff members + admin copies
 */

import nodemailer from "nodemailer";

// Initialize SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a welcome email to a newly created staff member
 * @param to - Staff member's email address
 * @param fullName - Staff member's full name
 * @param password - Generated password for the account
 * @param gymName - Name of the gym for context
 * @returns Promise with email send result
 */
export async function sendStaffWelcomeEmail(
  to: string,
  fullName: string,
  password: string,
  gymName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const loginUrl = `${appUrl}/login`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SoActiv</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${gymName || 'SoActiv'}!</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hello ${fullName},</h2>
            
            <p style="font-size: 16px; color: #4b5563;">
              Your staff account has been successfully created! You can now access the platform with the credentials below.
            </p>
            
            <div style="background: white; border-left: 4px solid #ea580c; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #1f2937;">Your Login Credentials</h3>
              <p style="margin: 10px 0;">
                <strong>Email:</strong> <span style="color: #ea580c;">${to}</span>
              </p>
              <p style="margin: 10px 0;">
                <strong>Password:</strong> <span style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 14px;">${password}</span>
              </p>
              ${gymName ? `<p style="margin: 10px 0;"><strong>Gym:</strong> <span style="color: #ea580c;">${gymName}</span></p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); 
                        color: white; 
                        padding: 14px 30px; 
                        text-decoration: none; 
                        border-radius: 6px; 
                        font-weight: bold; 
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Login to Your Account
              </a>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Security Tip:</strong> Please change your password after your first login for enhanced security.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you have any questions or need assistance, please don't hesitate to contact your administrator.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} SoActiv. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || "SoActiv <onboarding@soactiv.com>",
      to: to,
      subject: `Welcome to ${gymName || 'SoActiv'}!`,
      html: htmlContent,
    });

    console.log("✅ Staff welcome email sent successfully via SMTP:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("❌ Exception sending staff welcome email:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred during SMTP send",
    };
  }
}

/**
 * Sends admin copy email with staff details
 */
export async function sendAdminStaffCopyEmail(
  adminEmail: string,
  staffName: string,
  staffEmail: string,
  password: string,
  gymName?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Staff Created - Admin Copy</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🆕 New Staff Created</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">Admin Copy - Internal Record</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #065f46;">New Staff Details:</h2>
            
            <div style="background: white; border-left: 4px solid #059669; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 10px 0;"><strong>Name:</strong> <span style="color: #059669; font-weight: bold;">${staffName}</span></p>
              <p style="margin: 10px 0;"><strong>Staff Email:</strong> <span style="background: #f0fdf4; padding: 5px 10px; border-radius: 4px; font-size: 14px; color: #1f2937;">${staffEmail}</span></p>
              <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <span style="background: #1f2937; color: #fff; padding: 8px 12px; border-radius: 4px; font-size: 14px; font-family: monospace;">${password}</span></p>
              ${gymName ? `<p style="margin: 10px 0;"><strong>Gym:</strong> <span style="color: #059669;">${gymName}</span></p>` : ''}
            </div>
            
            <div style="background: #ecfdf5; border-left: 4px solid #34d399; padding: 15px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0; color: #047857; font-size: 14px;">
                <strong>✅ Staff has received their welcome email automatically.</strong>
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This is an automatic notification for your records.
            </p>
            
            <hr style="border: none; border-top: 1px solid #d1d5db; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} SoActiv. All rights reserved.
            </p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || "SoActiv <onboarding@soactiv.com>",
      to: adminEmail,
      subject: `Admin Copy: New Staff Created (${staffName})`,
      html: htmlContent,
    });

    console.log("✅ Admin copy email sent successfully via SMTP:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("❌ Exception sending admin copy email:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred during SMTP send",
    };
  }
}

/**
 * Sends a welcome email to a newly created gym client/member
 * @param to - Client's email address
 * @param fullName - Client's full name
 * @param password - Generated login password
 * @param gymName - Name of the gym
 * @param plan - Membership plan (basic/premium)
 * @param endDate - Membership end date
 * @returns Promise with email send result
 */
export async function sendClientWelcomeEmail(
  to: string,
  fullName: string,
  password: string,
  gymName?: string,
  plan?: string,
  endDate?: Date
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const loginUrl = `${appUrl}/login`;
    const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${gymName || 'SoActiv'}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏋️ Welcome, ${fullName}!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Your membership is now active at ${gymName || 'SoActiv'}</p>
          </div>

          <div style="background: #f0f9ff; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #4b5563;">
              We're thrilled to have you on board! Your member account has been created. Use the credentials below to access the member portal.
            </p>

            <div style="background: white; border-left: 4px solid #0891b2; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #1f2937;">Your Login Credentials</h3>
              <p style="margin: 10px 0;"><strong>Email:</strong> <span style="color: #0891b2;">${to}</span></p>
              <p style="margin: 10px 0;"><strong>Password:</strong> <span style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 14px; font-family: monospace;">${password}</span></p>
              ${gymName ? `<p style="margin: 10px 0;"><strong>Gym:</strong> <span style="color: #0891b2;">${gymName}</span></p>` : ''}
              ${plan ? `<p style="margin: 10px 0;"><strong>Plan:</strong> <span style="text-transform: capitalize; color: #0891b2;">${plan}</span></p>` : ''}
              ${endDate ? `<p style="margin: 10px 0;"><strong>Membership Valid Until:</strong> <span style="color: #374151;">${formattedEndDate}</span></p>` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}"
                 style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
                        color: white;
                        padding: 14px 30px;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                Access Member Portal
              </a>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Security Tip:</strong> Please change your password after your first login for enhanced security.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact the gym reception or your assigned trainer.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} SoActiv. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER || "SoActiv <onboarding@soactiv.com>",
      to: to,
      subject: `Welcome to ${gymName || 'SoActiv'} — Your Membership is Active! 🏋️`,
      html: htmlContent,
    });

    console.log("✅ Client welcome email sent successfully via SMTP:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("❌ Exception sending client welcome email:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred during SMTP send",
    };
  }
}
