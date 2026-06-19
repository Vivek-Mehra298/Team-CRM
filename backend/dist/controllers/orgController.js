"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSmtp = exports.updateOrganizationDetails = exports.getOrganizationDetails = exports.getMembers = exports.changeRole = exports.removeMember = exports.inviteMember = void 0;
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const Invitation_1 = __importDefault(require("../models/Invitation"));
const Organization_1 = __importDefault(require("../models/Organization"));
const Customer_1 = __importDefault(require("../models/Customer"));
const Task_1 = __importDefault(require("../models/Task"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const emailService_1 = require("../services/emailService");
// Invite member
const inviteMember = async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Validate role
        if (!['leader', 'manager', 'executive', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        const targetEmail = email.toLowerCase().trim();
        // Check if user is already registered
        const existingUser = await User_1.default.findOne({ email: targetEmail });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email is already registered' });
        }
        // Check if invitation already exists (resend/update logic)
        await Invitation_1.default.deleteOne({ email: targetEmail, orgId: req.user.orgId });
        const inviteToken = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days
        const invitation = new Invitation_1.default({
            email: targetEmail,
            orgId: req.user.orgId,
            role,
            token: inviteToken,
            expiresAt,
        });
        await invitation.save();
        // Get organization details
        const org = await Organization_1.default.findById(req.user.orgId);
        const orgName = org ? org.name : 'TeamCRM Workspace';
        // Send invite email in the background (non-blocking)
        (0, emailService_1.sendInviteEmail)(targetEmail, orgName, inviteToken).catch((err) => {
            console.error('[EMAIL ERROR]: Background invitation email sending failed:', err);
        });
        // Create Audit Log
        const audit = new AuditLog_1.default({
            orgId: req.user.orgId,
            userId: req.user.id,
            userName: req.user.name,
            action: 'invite_member',
            details: `Invited "${targetEmail}" as "${role}".`,
        });
        await audit.save();
        res.status(200).json({ message: 'Invitation sent successfully.', invitation });
    }
    catch (error) {
        console.error('Invite member error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.inviteMember = inviteMember;
// Remove member
const removeMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        if (!memberId) {
            return res.status(400).json({ error: 'Member ID is required' });
        }
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (req.user.id === memberId) {
            return res.status(400).json({ error: 'You cannot remove yourself from the organization' });
        }
        // Find user and check orgId match
        const userToRemove = await User_1.default.findOne({ _id: memberId, orgId: req.user.orgId });
        if (!userToRemove) {
            return res.status(444).json({ error: 'Member not found in your organization' });
        }
        // Reassign customers and tasks to leader/unassigned
        await Customer_1.default.updateMany({ orgId: req.user.orgId, assignedMemberId: memberId }, { $unset: { assignedMemberId: '' } });
        await Task_1.default.deleteMany({ orgId: req.user.orgId, assignedMemberId: memberId, status: 'pending' });
        const memberName = userToRemove.name;
        const memberEmail = userToRemove.email;
        await User_1.default.deleteOne({ _id: memberId });
        // Create Audit Log
        const audit = new AuditLog_1.default({
            orgId: req.user.orgId,
            userId: req.user.id,
            userName: req.user.name,
            action: 'remove_member',
            details: `Removed member "${memberName}" (${memberEmail}). Uncompleted tasks deleted, customers unassigned.`,
        });
        await audit.save();
        res.status(200).json({ message: 'Member removed successfully.' });
    }
    catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.removeMember = removeMember;
// Change member role
const changeRole = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { role } = req.body;
        if (!memberId || !role) {
            return res.status(400).json({ error: 'Member ID and role are required' });
        }
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!['leader', 'manager', 'executive', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        if (req.user.id === memberId) {
            return res.status(400).json({ error: 'You cannot change your own role' });
        }
        const member = await User_1.default.findOne({ _id: memberId, orgId: req.user.orgId });
        if (!member) {
            return res.status(404).json({ error: 'Member not found in your organization' });
        }
        const oldRole = member.role;
        member.role = role;
        await member.save();
        // Create Audit Log
        const audit = new AuditLog_1.default({
            orgId: req.user.orgId,
            userId: req.user.id,
            userName: req.user.name,
            action: 'change_role',
            details: `Changed role of "${member.name}" from "${oldRole}" to "${role}".`,
        });
        await audit.save();
        res.status(200).json({ message: 'Role updated successfully.', member });
    }
    catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.changeRole = changeRole;
// Get all members with statistics
const getMembers = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Fetch members
        const members = await User_1.default.find({ orgId: req.user.orgId }).select('-passwordHash');
        // Aggregate stats for each member
        const membersWithStats = await Promise.all(members.map(async (member) => {
            const assignedCustomersCount = await Customer_1.default.countDocuments({
                orgId: req.user?.orgId,
                assignedMemberId: member._id,
            });
            const totalTasks = await Task_1.default.countDocuments({
                orgId: req.user?.orgId,
                assignedMemberId: member._id,
            });
            const completedTasks = await Task_1.default.countDocuments({
                orgId: req.user?.orgId,
                assignedMemberId: member._id,
                status: 'completed',
            });
            const pendingTasks = await Task_1.default.countDocuments({
                orgId: req.user?.orgId,
                assignedMemberId: member._id,
                status: 'pending',
            });
            const wonCustomersCount = await Customer_1.default.countDocuments({
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
        }));
        res.status(200).json({ members: membersWithStats });
    }
    catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.getMembers = getMembers;
// Get current org details
const getOrganizationDetails = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const org = await Organization_1.default.findById(req.user.orgId);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        res.status(200).json({ org });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.getOrganizationDetails = getOrganizationDetails;
// Update org details
const updateOrganizationDetails = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { name } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: 'Organization name is required' });
        }
        const org = await Organization_1.default.findById(req.user.orgId);
        if (!org) {
            return res.status(404).json({ error: 'Organization not found' });
        }
        const oldName = org.name;
        org.name = name.trim();
        await org.save();
        // Create Audit Log
        const audit = new AuditLog_1.default({
            orgId: req.user.orgId,
            userId: req.user.id,
            userName: req.user.name,
            action: 'update_organization',
            details: `Updated organization name from "${oldName}" to "${org.name}".`,
        });
        await audit.save();
        res.status(200).json({ message: 'Organization name updated successfully', org });
    }
    catch (error) {
        console.error('Update organization error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.updateOrganizationDetails = updateOrganizationDetails;
// Test SMTP Connection (Diagnostic Endpoint)
const testSmtp = async (req, res) => {
    try {
        const result = await (0, emailService_1.verifySmtpConnection)();
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.testSmtp = testSmtp;
