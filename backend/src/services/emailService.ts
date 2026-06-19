import { CLIENT_URL } from '../config/env';

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${CLIENT_URL}/verify-email?token=${token}`;

  console.log('-----------------------------------------------------------------');
  console.log(`[EMAIL MOCK]: Verification email sent to: ${email}`);
  console.log(`[EMAIL MOCK]: Click the link below to verify:`);
  console.log(verificationUrl);
  console.log('-----------------------------------------------------------------');
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetUrl = `${CLIENT_URL}/forgot-password?token=${token}`;

  console.log('-----------------------------------------------------------------');
  console.log(`[EMAIL MOCK]: Password Reset email sent to: ${email}`);
  console.log(`[EMAIL MOCK]: Click the link below to reset your password:`);
  console.log(resetUrl);
  console.log('-----------------------------------------------------------------');
};

export const sendInviteEmail = async (email: string, orgName: string, token: string) => {
  const inviteUrl = `${CLIENT_URL}/signup?inviteToken=${token}`;

  console.log('-----------------------------------------------------------------');
  console.log(`[EMAIL MOCK]: Invitation sent to: ${email}`);
  console.log(`[EMAIL MOCK]: You have been invited to join organization: "${orgName}"`);
  console.log(`[EMAIL MOCK]: Click the link below to accept and complete signup:`);
  console.log(inviteUrl);
  console.log('-----------------------------------------------------------------');
};
