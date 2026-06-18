import { Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import Invitation from '../models/Invitation';
import Organization from '../models/Organization';
import Customer from '../models/Customer';
import Task from '../models/Task';
import AuditLog from '../models/AuditLog';
import { sendInviteEmail } from '../services/emailService';
import { AuthenticatedRequest } from '../middleware/auth';

// Invite member
export const inviteMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Validate role
    if (!['leader', 'manager', 'executive', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const targetEmail = email.toLowerCase().trim();

    // Check if user is already registered
    const existingUser = await User.findOne({ email: targetEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email is already registered' });
    }

    // Check if invitation already exists (resend/update logic)
    await Invitation.deleteOne({ email: targetEmail, orgId: req.user.orgId });

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days

    const invitation = new Invitation({
      email: targetEmail,
      orgId: req.user.orgId,
      role,
      token: inviteToken,
      expiresAt,
    });

    await invitation.save();

    // Get organization details
    const org = await Organization.findById(req.user.orgId);
    const orgName = org ? org.name : 'TeamCRM Workspace';

    // Send invite email (mocked)
    await sendInviteEmail(targetEmail, orgName, inviteToken);

    // Create Audit Log
    const audit = new AuditLog({
      orgId: req.user.orgId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'invite_member',
      details: `Invited "${targetEmail}" as "${role}".`,
    });
    await audit.save();

    res.status(200).json({ message: 'Invitation sent successfully.', invitation });
  } catch (error: any) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Remove member
export const removeMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.id === memberId) {
      return res.status(400).json({ error: 'You cannot remove yourself from the organization' });
    }

    // Find user and check orgId match
    const userToRemove = await User.findOne({ _id: memberId, orgId: req.user.orgId });
    if (!userToRemove) {
      return res.status(444).json({ error: 'Member not found in your organization' });
    }

    // Reassign customers and tasks to leader/unassigned
    await Customer.updateMany(
      { orgId: req.user.orgId, assignedMemberId: memberId },
      { $unset: { assignedMemberId: '' } }
    );
    await Task.deleteMany({ orgId: req.user.orgId, assignedMemberId: memberId, status: 'pending' });

    const memberName = userToRemove.name;
    const memberEmail = userToRemove.email;

    await User.deleteOne({ _id: memberId });

    // Create Audit Log
    const audit = new AuditLog({
      orgId: req.user.orgId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'remove_member',
      details: `Removed member "${memberName}" (${memberEmail}). Uncompleted tasks deleted, customers unassigned.`,
    });
    await audit.save();

    res.status(200).json({ message: 'Member removed successfully.' });
  } catch (error: any) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Change member role
export const changeRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;

    if (!memberId || !role) {
      return res.status(400).json({ error: 'Member ID and role are required' });
    }

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (!['leader', 'manager', 'executive', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (req.user.id === memberId) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }

    const member = await User.findOne({ _id: memberId, orgId: req.user.orgId });
    if (!member) {
      return res.status(404).json({ error: 'Member not found in your organization' });
    }

    const oldRole = member.role;
    member.role = role;
    await member.save();

    // Create Audit Log
    const audit = new AuditLog({
      orgId: req.user.orgId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'change_role',
      details: `Changed role of "${member.name}" from "${oldRole}" to "${role}".`,
    });
    await audit.save();

    res.status(200).json({ message: 'Role updated successfully.', member });
  } catch (error: any) {
    console.error('Change role error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get all members with statistics
export const getMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch members
    const members = await User.find({ orgId: req.user.orgId }).select('-passwordHash');

    // Aggregate stats for each member
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const assignedCustomersCount = await Customer.countDocuments({
          orgId: req.user?.orgId,
          assignedMemberId: member._id,
        });

        const totalTasks = await Task.countDocuments({
          orgId: req.user?.orgId,
          assignedMemberId: member._id,
        });

        const completedTasks = await Task.countDocuments({
          orgId: req.user?.orgId,
          assignedMemberId: member._id,
          status: 'completed',
        });

        const pendingTasks = await Task.countDocuments({
          orgId: req.user?.orgId,
          assignedMemberId: member._id,
          status: 'pending',
        });

        const wonCustomersCount = await Customer.countDocuments({
          orgId: req.user?.orgId,
          assignedMemberId: member._id,
          status: 'won',
        });

        return {
          ...member.toJSON(),
          stats: {
            assignedCustomers: assignedCustomersCount,
            totalTasks,
            completedTasks,
            pendingTasks,
            wonCustomers: wonCustomersCount,
          },
        };
      })
    );

    res.status(200).json({ members: membersWithStats });
  } catch (error: any) {
    console.error('Get members error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get current org details
export const getOrganizationDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const org = await Organization.findById(req.user.orgId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.status(200).json({ org });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
