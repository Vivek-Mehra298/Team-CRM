import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import Customer from '../models/Customer';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import { AuthenticatedRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Create Customer
export const createCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, phone, company, address, notes, tags, assignedMemberId, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Verify assigned member belongs to same org
    if (assignedMemberId) {
      const assignedUser = await User.findOne({ _id: assignedMemberId, orgId: req.user.orgId });
      if (!assignedUser) {
        return res.status(400).json({ error: 'Assigned member does not exist in this organization' });
      }
    }

    const newCustomer = new Customer({
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
    const audit = new AuditLog({
      orgId: req.user.orgId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'create_customer',
      details: `Created customer "${name}" (${company || 'No Company'}).`,
    });
    await audit.save();

    // Create Notification if assigned to someone else
    if (assignedMemberId && assignedMemberId !== req.user.id) {
      const notification = new Notification({
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
  } catch (error: any) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get Customers with filters, search and pagination
export const getCustomers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const assignedMemberId = (req.query.assignedMemberId as string) || '';
    const tag = (req.query.tag as string) || '';

    // Base query scoped to organization
    const query: any = { orgId: req.user.orgId };

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
      } else {
        query.assignedMemberId = assignedMemberId;
      }
    }
    if (tag) {
      query.tags = tag;
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
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
  } catch (error: any) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get customer by ID
export const getCustomerById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const customer = await Customer.findOne({ _id: id, orgId: req.user.orgId })
      .populate('assignedMemberId', 'name email role')
      .populate('files.uploadedBy', 'name');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.status(200).json({ customer });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Update Customer
export const updateCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const customer = await Customer.findOne({ _id: id, orgId: req.user.orgId });
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
      const assignedUser = await User.findOne({ _id: updateFields.assignedMemberId, orgId: req.user.orgId });
      if (!assignedUser) {
        return res.status(400).json({ error: 'Assigned member does not exist in this organization' });
      }

      // Notify new assignee
      if (updateFields.assignedMemberId !== req.user.id) {
        const notification = new Notification({
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
        (customer as any)[key] = updateFields[key];
      }
    });

    await customer.save();

    // Audit Log for changes
    let auditDetails = `Updated customer "${customer.name}".`;
    if (newStatus && oldStatus !== newStatus) {
      auditDetails += ` Status changed from "${oldStatus}" to "${newStatus}".`;

      // Log notification if status changes to won (Deal Won!)
      if (newStatus === 'won') {
        const notification = new Notification({
          orgId: req.user.orgId,
          recipientId: customer.assignedMemberId || req.user.id,
          type: 'deal_won',
          title: 'Deal Won! 🎉',
          message: `Deal for customer "${customer.name}" has been marked as WON!`,
          referenceId: customer._id,
        });
        await notification.save();

        // Broadcast org-wide notification
        const leaders = await User.find({ orgId: req.user.orgId, role: 'leader' });
        for (const leader of leaders) {
          if (leader._id.toString() !== req.user.id) {
            const lNotif = new Notification({
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

    const audit = new AuditLog({
      orgId: req.user.orgId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'update_customer',
      details: auditDetails,
    });
    await audit.save();

    res.status(200).json({ message: 'Customer updated successfully.', customer });
  } catch (error: any) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Delete Customer (Leader/Manager only)
export const deleteCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // RBAC
    if (req.user.role !== 'leader' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Only leaders and managers can delete customers.' });
    }

    const customer = await Customer.findOne({ _id: id, orgId: req.user.orgId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerName = customer.name;

    // Delete attached files from disk
    for (const file of customer.files) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {
        console.error(`Failed to delete file ${file.path} from disk:`, err);
      }
    }

    await Customer.deleteOne({ _id: id });

    // Audit Log
    const audit = new AuditLog({
      orgId: req.user.orgId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'delete_customer',
      details: `Deleted customer "${customerName}" and all associated files.`,
    });
    await audit.save();

    res.status(200).json({ message: 'Customer deleted successfully.' });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Attach File to Customer
export const attachFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Forbidden: Viewers cannot upload files.' });
    }

    const customer = await Customer.findOne({ _id: id, orgId: req.user.orgId });
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
      uploadedBy: new mongoose.Types.ObjectId(req.user.id),
      uploadedAt: new Date(),
    };

    customer.files.push(fileData);
    await customer.save();

    // Audit Log
    const audit = new AuditLog({
      orgId: req.user.orgId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'attach_file',
      details: `Attached file "${fileData.name}" (${(fileData.size / 1024).toFixed(1)} KB) to customer "${customer.name}".`,
    });
    await audit.save();

    res.status(200).json({ message: 'File uploaded and attached successfully.', customer });
  } catch (error: any) {
    console.error('Attach file error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Delete Attached File
export const deleteFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { customerId, fileId } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Forbidden: Viewers cannot delete files.' });
    }

    const customer = await Customer.findOne({ _id: customerId, orgId: req.user.orgId });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const fileIndex = customer.files.findIndex((f: any) => f._id.toString() === fileId);
    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File attachment not found' });
    }

    const file = customer.files[fileIndex];

    // Delete file from disk
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.error(`Failed to delete file ${file.path} from disk:`, err);
    }

    const fileName = file.name;
    customer.files.splice(fileIndex, 1);
    await customer.save();

    // Audit Log
    const audit = new AuditLog({
      orgId: req.user.orgId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'delete_file',
      details: `Deleted file attachment "${fileName}" from customer "${customer.name}".`,
    });
    await audit.save();

    res.status(200).json({ message: 'File deleted successfully.', customer });
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
