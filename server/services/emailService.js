const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Creates reusable Nodemailer transporter using standard Gmail or custom SMTP credentials
 */
const createTransporter = () => {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.EMAIL_PASS;

  if (user && pass) {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass }
      });
    }

    // Default to Gmail service if host isn't specified
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return null;
};

// Generate 6-Digit Numeric OTP
const generate6DigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends 6-digit Group Invite OTP Email to recipient email
 */
const sendInviteOtpEmail = async ({ email, name, groupName, otp }) => {
  const senderEmail = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || 'no-reply@equallysplit.com';
  
  console.log('\n==========================================');
  console.log(`🔑 [OTP GENERATED FOR ${email}]`);
  console.log(`👤 Name: ${name}`);
  console.log(`🏷️ Group: ${groupName}`);
  console.log(`✨ 6-DIGIT OTP CODE: [ ${otp} ]`);
  console.log('==========================================\n');

  const transporter = createTransporter();
  
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'Equally Split'}" <${senderEmail}>`,
        to: email,
        subject: `Your 6-Digit OTP to Join "${groupName}" on Equally Split`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #4f46e5; margin-top: 0;">Equally Split Group Invitation</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>You have been invited to join the group <strong>"${groupName}"</strong> on Equally Split!</p>
            <p>Use the following 6-digit One-Time Password (OTP) to verify your identity and complete your group setup:</p>
            <div style="background-color: #f3f4f6; padding: 18px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937; border-radius: 12px; margin: 20px 0; border: 1px solid #e5e7eb;">
              ${otp}
            </div>
            <p style="font-size: 12px; color: #6b7280;">This OTP code is valid for 10 minutes. If you did not expect this invite, please ignore this email.</p>
          </div>
        `
      });
      console.log(`✉️ SUCCESS: Real Email OTP sent to inbox of ${email}`);
      return { success: true };
    } catch (err) {
      console.error('❌ Nodemailer Error sending real email:', err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.warn(`⚠️ REAL EMAIL NOT SENT: Please set SMTP_USER and SMTP_PASS (or GMAIL_USER & GMAIL_PASS) in server/.env file.`);
    return { success: false, reason: 'NO_SMTP_CONFIG' };
  }
};

module.exports = {
  generate6DigitOtp,
  sendInviteOtpEmail
};
