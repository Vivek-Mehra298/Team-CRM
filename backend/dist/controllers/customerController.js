"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.attachFile = exports.deleteCustomer = exports.updateCustomer = exports.getCustomerById = exports.getCustomers = exports.createCustomer = void 0;
const fs_1 = __importDefault(require("fs"));
const Customer_1 = __importDefault(require("../models/Customer"));
const User_1 = __importDefault(require("../models/User"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const Notification_1 = __importDefault(require("../models/Notification"));
const mongoose_1 = __importDefault(require("mongoose"));
// Create Customer
const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, company, address, notes, tags, assignedMemberId, status } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Customer name is required' });
        }
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Verify assigned member belongs to same org
        if (assignedMemberId) {
            const assignedUser = await User_1.default.findOne({ _id: assignedMemberId, orgId: req.user.orgId });
            if (!assignedUser) {
                return res.status(400).json({ error: 'Assigned member does not exist in this organization' });
            }
        }
        const newCustomer = new Customer_1.default({
            orgId: req.user.orgId,
            name,
            email,
            phone,
            company,
            address,
            notes,
            tags: tags || [],
            assignedMemberId: assignedMemberId || undefined,
            status: status || 'lead',
            files: [],
        });
        await newCustomer.save();
        // Audit Log
        const audit = new AuditLog_1.default({
            orgId: req.user.orgId,
            userId: req.user.id,
            userName: req.user.name,
            action: 'create_customer',
            details: `Created customer "${name}" (${company || 'No Company'}).`,
        });
        await audit.save();
        // Create Notification if assigned to someone else
        if (assignedMemberId && assignedMemberId !== req.user.id) {
            const notification = new Notification_1.default({
                orgId: req.user.orgId,
                recipientId: assignedMemberId,
                type: 'customer_assigned',
                title: 'New Customer Assigned',
                message: `${req.user.name} assigned customer "${name}" to you.`,
                referenceId: newCustomer._id,
            });
            await notification.save();
        }
        res.status(201).json({ message: 'Customer created successfully.', customer: newCustomer });
    }
    catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.createCustomer = createCustomer;
// Get Customers with filters, search and pagination
const getCustomers = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const assignedMemberId = req.query.assignedMemberId || '';
        const tag = req.query.tag || '';
        // Base query scoped to organization
        const query = { orgId: req.user.orgId };
        // Search query
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
            ];
        }
        // Filters
        if (status) {
            query.status = status;
        }
        if (assignedMemberId) {
            if (assignedMemberId === 'unassigned') {
                query.assignedMemberId = { $exists: false };
            }
            else {
                query.assignedMemberId = assignedMemberId;
            }
        }
        if (tag) {
            query.tags = tag;
        }
        const total = await Customer_1.default.countDocuments(query);
        const customers = await Customer_1.default.find(query)
            .populate('assignedMemberId', 'name email role')
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);
        res.status(200).json({
            customers,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.getCustomers = getCustomers;
// Get customer by ID
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const customer = await Customer_1.default.findOne({ _id: id, orgId: req.user.orgId })
            .populate('assignedMemberId', 'name email role')
            .populate('files.uploadedBy', 'name');
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.status(200).json({ customer });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.getCustomerById = getCustomerById;
// Update Customer
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const customer = await Customer_1.default.findOne({ _id: id, orgId: req.user.orgId });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        // Role verification ( viewer is read-only )
        if (req.user.role === 'viewer') {
            return res.status(403).json({ error: 'Forbidden: Viewers cannot edit customers.' });
        }
        const oldStatus = customer.status;
        const newStatus = updateFields.status;
        // Verify assigned member if updating
        if (updateFields.assignedMemberId && updateFields.assignedMemberId !== customer.assignedMemberId?.toString()) {
            const assignedUser = await User_1.default.findOne({ _id: updateFields.assignedMemberId, orgId: req.user.orgId });
            if (!assignedUser) {
                return res.status(400).json({ error: 'Assigned member does not exist in this organization' });
            }
            // Notify new assignee
            if (updateFields.assignedMemberId !== req.user.id) {
                const notification = new Notification_1.default({
                    orgId: req.user.orgId,
                    recipientId: updateFields.assignedMemberId,
                    type: 'customer_assigned',
                    title: 'Customer Assigned',
                    message: `${req.user.name} assigned customer "${customer.name}" to you.`,
                    referenceId: customer._id,
                });
                await notification.save();
            }
        }
        // Apply updates
        Object.keys(updateFields).forEach((key) => {
            if (key !== 'files' && key !== 'orgId') {
                customer[key] = updateFields[key];
            }
        });
        await customer.save();
        // Audit Log for changes
        let auditDetails = `Updated customer "${customer.name}".`;
        if (newStatus && oldStatus !== newStatus) {
            auditDetails += ` Status changed from "${oldStatus}" to "${newStatus}".`;
            // Log notification if status changes to won (Deal Won!)
            if (newStatus === 'won') {
                const notification = new Notification_1.default({
                    orgId: req.user.orgId,
                    recipientId: customer.assignedMemberId || req.user.id,
                    type: 'deal_won',
                    title: 'Deal Won! 🎉',
                    message: `Deal for customer "${customer.name}" has been marked as WON!`,
                    referenceId: customer._id,
                });
                await notification.save();
                // Broadcast org-wide notification
                const leaders = await User_1.default.find({ orgId: req.user.orgId, role: 'leader' });
                for (const leader of leaders) {
                    if (leader._id.toString() !== req.user.id) {
                        const lNotif = new Notification_1.default({
                            orgId: req.user.orgId,
                            recipientId: leader._id,
                            type: 'deal_won',
                            title: 'Deal Won! 🎉',
                            message: `${req.user.name} won a deal for "${customer.name}".`,
                            referenceId: customer._id,
                        });
                        await lNotif.save();
                    }
                }
            }
        }
        const audit = new AuditLog_1.default({
            orgId: req.user.orgId,
            userId: req.user.id,
            userName: req.user.name,
            action: 'update_customer',
            details: auditDetails,
        });
        await audit.save();
        res.status(200).json({ message: 'Customer updated successfully.', customer });
    }
    catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.updateCustomer = updateCustomer;
// Delete Customer (Leader/Manager only)
const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // RBAC
        if (req.user.role !== 'leader' && req.user.role !== 'manager') {
            return res.status(403).json({ error: 'Forbidden: Only leaders and managers can delete customers.' });
        }
        const customer = await Customer_1.default.findOne({ _id: id, orgId: req.user.orgId });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const customerName = customer.name;
        // Delete attached files from disk
        for (const file of customer.files) {
            try {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            }
            catch (err) {
                console.error(`Failed to delete file ${file.path} from disk:`, err);
            }
        }
        await Customer_1.default.deleteOne({ _id: id });
        // Audit Log
        const audit = new AuditLog_1.default({
            orgId: req.user.orgId,
            userId: req.user.id,
            userName: req.user.name,
            action: 'delete_customer',
            details: `Deleted customer "${customerName}" and all associated files.`,
        });
        await audit.save();
        res.status(200).json({ message: 'Customer deleted successfully.' });
    }
    catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.deleteCustomer = deleteCustomer;
// Attach File to Customer
const attachFile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (req.user.role === 'viewer') {
            return res.status(403).json({ error: 'Forbidden: Viewers cannot upload files.' });
        }
        const customer = await Customer_1.default.findOne({ _id: id, orgId: req.user.orgId });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileData = {
            name: req.file.originalname,
            path: req.file.path,
            mimeType: req.file.mimetype,
            size: req.file.size,
            uploadedBy: new mongoose_1.default.Types.ObjectId(req.user.id),
            uploadedAt: new Date(),
        };
        customer.files.push(fileData);
        await customer.save();
        // Audit Log
        const audit = new AuditLog_1.default({
            orgId: req.user.orgId,
            userId: req.user.id,
            userName: req.user.name,
            action: 'attach_file',
            details: `Attached file "${fileData.name}" (${(fileData.size / 1024).toFixed(1)} KB) to customer "${customer.name}".`,
        });
        await audit.save();
        res.status(200).json({ message: 'File uploaded and attached successfully.', customer });
    }
    catch (error) {
        console.error('Attach file error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.attachFile = attachFile;
// Delete Attached File
const deleteFile = async (req, res) => {
    try {
        const { customerId, fileId } = req.params;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (req.user.role === 'viewer') {
            return res.status(403).json({ error: 'Forbidden: Viewers cannot delete files.' });
        }
        const customer = await Customer_1.default.findOne({ _id: customerId, orgId: req.user.orgId });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const fileIndex = customer.files.findIndex((f) => f._id.toString() === fileId);
        if (fileIndex === -1) {
            return res.status(404).json({ error: 'File attachment not found' });
        }
        const file = customer.files[fileIndex];
        // Delete file from disk
        try {
            if (fs_1.default.existsSync(file.path)) {
                fs_1.default.unlinkSync(file.path);
            }
        }
        catch (err) {
            console.error(`Failed to delete file ${file.path} from disk:`, err);
        }
        const fileName = file.name;
        customer.files.splice(fileIndex, 1);
        await customer.save();
        // Audit Log
        const audit = new AuditLog_1.default({
            orgId: req.user.orgId,
            userId: req.user.id,
            userName: req.user.name,
            action: 'delete_file',
            details: `Deleted file attachment "${fileName}" from customer "${customer.name}".`,
        });
        await audit.save();
        res.status(200).json({ message: 'File deleted successfully.', customer });
    }
    catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.deleteFile = deleteFile;
