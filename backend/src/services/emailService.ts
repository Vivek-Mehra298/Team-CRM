export const sendVerificationEmail = async (email: string, token: string) => {
  console.log('-----------------------------------------------------------------');
  console.log(`[EMAIL MOCK]: Verification email sent to: ${email}`);
  console.log(`[EMAIL MOCK]: Click the link below to verify:`);
  console.log(`http://localhost:3000/verify-email?token=${token}`);
  console.log('-----------------------------------------------------------------');
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  console.log('-----------------------------------------------------------------');
  console.log(`[EMAIL MOCK]: Password Reset email sent to: ${email}`);
  console.log(`[EMAIL MOCK]: Click the link below to reset your password:`);
  console.log(`http://localhost:3000/forgot-password/reset?token=${token}`);
  console.log('-----------------------------------------------------------------');
};

export const sendInviteEmail = async (email: string, orgName: string, token: string) => {
  console.log('-----------------------------------------------------------------');
  console.log(`[EMAIL MOCK]: Invitation sent to: ${email}`);
  console.log(`[EMAIL MOCK]: You have been invited to join organization: "${orgName}"`);
  console.log(`[EMAIL MOCK]: Click the link below to accept and complete signup:`);
  console.log(`http://localhost:3000/signup?inviteToken=${token}`);
  console.log('-----------------------------------------------------------------');
};
