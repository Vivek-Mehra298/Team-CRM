"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getMe = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.login = exports.signup = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const Organization_1 = __importDefault(require("../models/Organization"));
const Invitation_1 = __importDefault(require("../models/Invitation"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const emailService_1 = require("../services/emailService");
const env_1 = require("../config/env");
const JWT_SECRET = (0, env_1.getJwtSecret)();
const signup = async (req, res) => {
    try {
        const { name, password, orgName, inviteToken } = req.body;
        let { email } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        email = email.toLowerCase().trim();
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
        let orgId;
        let role = 'leader';
        if (inviteToken) {
            // Joining existing organization via invite
            const invitation = await Invitation_1.default.findOne({ token: inviteToken });
            if (!invitation || invitation.expiresAt < new Date()) {
                return res.status(400).json({ error: 'Invalid or expired invitation token' });
            }
            orgId = invitation.orgId;
            role = invitation.role;
            email = invitation.email; // Enforce the invited email
            // Delete invitation once accepted
            await Invitation_1.default.deleteOne({ _id: invitation._id });
        }
        else {
            // Create new organization
            if (!orgName) {
                return res.status(400).json({ error: 'Organization name is required for new registration' });
            }
            const newOrg = new Organization_1.default({ name: orgName });
            await newOrg.save();
            orgId = newOrg._id;
        }
        const newUser = new User_1.default({
            name,
            email,
            passwordHash,
            role,
            orgId,
            isVerified: inviteToken ? true : false, // Auto-verify if they signed up via email invitation link
            verificationToken: inviteToken ? undefined : verificationToken,
        });
        await newUser.save();
        if (!inviteToken) {
            // Send verification email (mocked)
            await (0, emailService_1.sendVerificationEmail)(email, verificationToken);
        }
        // Get organization name
        const org = await Organization_1.default.findById(orgId);
        // Create Audit Log
        const audit = new AuditLog_1.default({
            orgId,
            userId: newUser._id,
            userName: newUser.name,
            action: 'signup',
            details: `User registered as ${role} for organization "${org?.name || 'Unknown'}".`,
        });
        await audit.save();
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            orgId: newUser.orgId,
            name: newUser.name,
        }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: inviteToken
                ? 'Signup successful.'
                : 'Signup successful. Please check email for verification code.',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                orgId: newUser.orgId,
                isVerified: newUser.isVerified,
            },
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            email: user.email,
            role: user.role,
            orgId: user.orgId,
            name: user.name,
        }, JWT_SECRET, { expiresIn: '7d' });
        // Create Audit Log
        const audit = new AuditLog_1.default({
            orgId: user.orgId,
            userId: user._id,
            userName: user.name,
            action: 'login',
            details: `User logged in successfully.`,
        });
        await audit.save();
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                orgId: user.orgId,
                isVerified: user.isVerified,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.login = login;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Verification token is required' });
        }
        const user = await User_1.default.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        // Create Audit Log
        const audit = new AuditLog_1.default({
            orgId: user.orgId,
            userId: user._id,
            userName: user.name,
            action: 'email_verified',
            details: `User verified their email address.`,
        });
        await audit.save();
        res.status(200).json({ message: 'Email verified successfully.' });
    }
    catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.verifyEmail = verifyEmail;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const user = await User_1.default.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            // Return 200 even if user not found to prevent user enumeration
            return res.status(200).json({ message: 'If that email exists, we sent a password reset link.' });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();
        // Send reset email (mocked)
        await (0, emailService_1.sendPasswordResetEmail)(user.email, resetToken);
        res.status(200).json({ message: 'If that email exists, we sent a password reset link.' });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }
        const user = await User_1.default.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired password reset token' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        // Create Audit Log
        const audit = new AuditLog_1.default({
            orgId: user.orgId,
            userId: user._id,
            userName: user.name,
            action: 'password_reset',
            details: `User reset their account password.`,
        });
        await audit.save();
        res.status(200).json({ message: 'Password has been reset successfully.' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.resetPassword = resetPassword;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User_1.default.findById(req.user.id).populate('orgId', 'name');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ user });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.getMe = getMe;
const logout = async (req, res) => {
    try {
        if (req.user) {
            const audit = new AuditLog_1.default({
                orgId: req.user.orgId,
                userId: req.user.id,
                userName: req.user.name,
                action: 'logout',
                details: 'User logged out.',
            });
            await audit.save();
        }
        res.status(200).json({ message: 'Logged out successfully.' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.logout = logout;
