import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import Organization from '../models/Organization';
import Invitation from '../models/Invitation';
import AuditLog from '../models/AuditLog';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';
import { AuthenticatedRequest } from '../middleware/auth';
import { getJwtSecret } from '../config/env';

const JWT_SECRET = getJwtSecret();

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, password, orgName, inviteToken } = req.body;
    let { email } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    email = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    let orgId;
    let role = 'leader';

    if (inviteToken) {
      // Joining existing organization via invite
      const invitation = await Invitation.findOne({ token: inviteToken });
      if (!invitation || invitation.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired invitation token' });
      }

      orgId = invitation.orgId;
      role = invitation.role;
      email = invitation.email; // Enforce the invited email

      // Delete invitation once accepted
      await Invitation.deleteOne({ _id: invitation._id });
    } else {
      // Create new organization
      if (!orgName) {
        return res.status(400).json({ error: 'Organization name is required for new registration' });
      }
      const newOrg = new Organization({ name: orgName });
      await newOrg.save();
      orgId = newOrg._id;
    }

    const newUser = new User({
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
      await sendVerificationEmail(email, verificationToken);
    }

    // Get organization name
    const org = await Organization.findById(orgId);

    // Create Audit Log
    const audit = new AuditLog({
      orgId,
      userId: newUser._id,
      userName: newUser.name,
      action: 'signup',
      details: `User registered as ${role} for organization "${org?.name || 'Unknown'}".`,
    });
    await audit.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        orgId: newUser.orgId,
        name: newUser.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create Audit Log
    const audit = new AuditLog({
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
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Create Audit Log
    const audit = new AuditLog({
      orgId: user.orgId,
      userId: user._id,
      userName: user.name,
      action: 'email_verified',
      details: `User verified their email address.`,
    });
    await audit.save();

    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error: any) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return 200 even if user not found to prevent user enumeration
      return res.status(200).json({ message: 'If that email exists, we sent a password reset link.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send reset email (mocked)
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ message: 'If that email exists, we sent a password reset link.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Create Audit Log
    const audit = new AuditLog({
      orgId: user.orgId,
      userId: user._id,
      userName: user.name,
      action: 'password_reset',
      details: `User reset their account password.`,
    });
    await audit.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id).populate('orgId', 'name');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user) {
      const audit = new AuditLog({
        orgId: req.user.orgId,
        userId: req.user.id,
        userName: req.user.name,
        action: 'logout',
        details: 'User logged out.',
      });
      await audit.save();
    }
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
