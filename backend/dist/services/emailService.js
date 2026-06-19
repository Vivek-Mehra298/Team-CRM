"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInviteEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const env_1 = require("../config/env");
const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${env_1.CLIENT_URL}/verify-email?token=${token}`;
    console.log('-----------------------------------------------------------------');
    console.log(`[EMAIL MOCK]: Verification email sent to: ${email}`);
    console.log(`[EMAIL MOCK]: Click the link below to verify:`);
    console.log(verificationUrl);
    console.log('-----------------------------------------------------------------');
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${env_1.CLIENT_URL}/forgot-password?token=${token}`;
    console.log('-----------------------------------------------------------------');
    console.log(`[EMAIL MOCK]: Password Reset email sent to: ${email}`);
    console.log(`[EMAIL MOCK]: Click the link below to reset your password:`);
    console.log(resetUrl);
    console.log('-----------------------------------------------------------------');
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendInviteEmail = async (email, orgName, token) => {
    const inviteUrl = `${env_1.CLIENT_URL}/signup?inviteToken=${token}`;
    console.log('-----------------------------------------------------------------');
    console.log(`[EMAIL MOCK]: Invitation sent to: ${email}`);
    console.log(`[EMAIL MOCK]: You have been invited to join organization: "${orgName}"`);
    console.log(`[EMAIL MOCK]: Click the link below to accept and complete signup:`);
    console.log(inviteUrl);
    console.log('-----------------------------------------------------------------');
};
exports.sendInviteEmail = sendInviteEmail;
