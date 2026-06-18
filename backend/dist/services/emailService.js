"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInviteEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const sendVerificationEmail = async (email, token) => {
    console.log('-----------------------------------------------------------------');
    console.log(`[EMAIL MOCK]: Verification email sent to: ${email}`);
    console.log(`[EMAIL MOCK]: Click the link below to verify:`);
    console.log(`http://localhost:3000/verify-email?token=${token}`);
    console.log('-----------------------------------------------------------------');
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (email, token) => {
    console.log('-----------------------------------------------------------------');
    console.log(`[EMAIL MOCK]: Password Reset email sent to: ${email}`);
    console.log(`[EMAIL MOCK]: Click the link below to reset your password:`);
    console.log(`http://localhost:3000/forgot-password/reset?token=${token}`);
    console.log('-----------------------------------------------------------------');
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendInviteEmail = async (email, orgName, token) => {
    console.log('-----------------------------------------------------------------');
    console.log(`[EMAIL MOCK]: Invitation sent to: ${email}`);
    console.log(`[EMAIL MOCK]: You have been invited to join organization: "${orgName}"`);
    console.log(`[EMAIL MOCK]: Click the link below to accept and complete signup:`);
    console.log(`http://localhost:3000/signup?inviteToken=${token}`);
    console.log('-----------------------------------------------------------------');
};
exports.sendInviteEmail = sendInviteEmail;
