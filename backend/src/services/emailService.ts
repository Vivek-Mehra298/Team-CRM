import nodemailer from 'nodemailer';
import { CLIENT_URL } from '../config/env';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || '"TeamCRM" <noreply@teamcrm.space>';

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 15000,     // 15 seconds
  });
  console.log('[EMAIL SERVICE]: SMTP Transporter initialized successfully.');
} else {
  console.warn(
    '[EMAIL WARNING]: SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are missing. Running in mock console-log mode.'
  );
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${CLIENT_URL}/verify-email?token=${token}`;

  if (transporter) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #0284c7; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
          .content { padding: 40px 32px; text-align: left; }
          .content p { font-size: 14px; line-height: 24px; color: #334155; margin: 0 0 20px; }
          .btn-container { text-align: center; margin: 32px 0 0; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: 600; border-radius: 8px; }
          .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer p { font-size: 11px; color: #64748b; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your TeamCRM Account</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for signing up for TeamCRM! Please click the button below to verify your email address and activate your account:</p>
            <div class="btn-container">
              <a href="${verificationUrl}" class="btn" target="_blank">Verify Email Address</a>
            </div>
            <p style="margin-top: 32px; font-size: 12px; color: #64748b;">If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="font-size: 12px; word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
          </div>
          <div class="footer">
            <p>If you did not create a TeamCRM account, you can safely ignore this email.</p>
            <p style="margin-top: 8px;">&copy; 2026 TeamCRM. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: 'Verify Your TeamCRM Account',
        html: htmlContent,
      });
      console.log(`[EMAIL SERVICE]: Verification email successfully sent to ${email}`);
      return;
    } catch (error) {
      console.error(`[EMAIL ERROR]: Failed to send verification email to ${email}:`, error);
    }
  }

  // Fallback Mock
  console.log('-----------------------------------------------------------------');
  console.log(`[EMAIL MOCK]: Verification email sent to: ${email}`);
  console.log(`[EMAIL MOCK]: Click the link below to verify:`);
  console.log(verificationUrl);
  console.log('-----------------------------------------------------------------');
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${CLIENT_URL}/forgot-password?token=${token}`;

  if (transporter) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #0284c7; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
          .content { padding: 40px 32px; text-align: left; }
          .content p { font-size: 14px; line-height: 24px; color: #334155; margin: 0 0 20px; }
          .btn-container { text-align: center; margin: 32px 0 0; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: 600; border-radius: 8px; }
          .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer p { font-size: 11px; color: #64748b; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your TeamCRM Password</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You are receiving this email because we received a password reset request for your TeamCRM account. Click the button below to set a new password:</p>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
            </div>
            <p style="margin-top: 32px; font-size: 12px; color: #64748b;">If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="font-size: 12px; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
            <p style="margin-top: 20px; font-size: 13px; color: #e11d48; font-weight: 500;">Note: This link is valid for 1 hour only.</p>
          </div>
          <div class="footer">
            <p>If you did not request a password reset, no further action is required.</p>
            <p style="margin-top: 8px;">&copy; 2026 TeamCRM. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: 'Reset Your TeamCRM Password',
        html: htmlContent,
      });
      console.log(`[EMAIL SERVICE]: Password reset email successfully sent to ${email}`);
      return;
    } catch (error) {
      console.error(`[EMAIL ERROR]: Failed to send password reset email to ${email}:`, error);
    }
  }

  // Fallback Mock
  console.log('-----------------------------------------------------------------');
  console.log(`[EMAIL MOCK]: Password Reset email sent to: ${email}`);
  console.log(`[EMAIL MOCK]: Click the link below to reset your password:`);
  console.log(resetUrl);
  console.log('-----------------------------------------------------------------');
};

export const sendInviteEmail = async (email: string, orgName: string, token: string) => {
  const inviteUrl = `${CLIENT_URL}/signup?inviteToken=${token}`;

  if (transporter) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #0284c7; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
          .content { padding: 40px 32px; text-align: left; }
          .content p { font-size: 14px; line-height: 24px; color: #334155; margin: 0 0 20px; }
          .org-badge { display: inline-block; background-color: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1; padding: 6px 16px; font-weight: 700; font-size: 14px; text-transform: uppercase; border-radius: 9999px; margin-bottom: 20px; }
          .btn-container { text-align: center; margin: 32px 0 0; }
          .btn { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 32px; font-size: 14px; font-weight: 600; border-radius: 8px; }
          .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer p { font-size: 11px; color: #64748b; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Join TeamCRM Workspace</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have been invited to join the following organization workspace on TeamCRM:</p>
            <div style="text-align: center;"><span class="org-badge">${orgName}</span></div>
            <p>Please click the button below to accept this invitation, complete your sign up, and join your team:</p>
            <div class="btn-container">
              <a href="${inviteUrl}" class="btn" target="_blank">Join Team Workspace</a>
            </div>
            <p style="margin-top: 32px; font-size: 12px; color: #64748b;">If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="font-size: 12px; word-break: break-all;"><a href="${inviteUrl}">${inviteUrl}</a></p>
          </div>
          <div class="footer">
            <p>This invitation link will expire in 7 days. If you did not expect this invitation, you can ignore this email.</p>
            <p style="margin-top: 8px;">&copy; 2026 TeamCRM. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: `Invitation to join "${orgName}" workspace on TeamCRM`,
        html: htmlContent,
      });
      console.log(`[EMAIL SERVICE]: Invitation email successfully sent to ${email}`);
      return;
    } catch (error) {
      console.error(`[EMAIL ERROR]: Failed to send invitation email to ${email}:`, error);
    }
  }

  // Fallback Mock
  console.log('-----------------------------------------------------------------');
  console.log(`[EMAIL MOCK]: Invitation sent to: ${email}`);
  console.log(`[EMAIL MOCK]: You have been invited to join organization: "${orgName}"`);
  console.log(`[EMAIL MOCK]: Click the link below to accept and complete signup:`);
  console.log(inviteUrl);
  console.log('-----------------------------------------------------------------');
};
