import { Response } from 'express';
import Task from '../models/Task';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import Notification from '../models/Notification';
import { AuthenticatedRequest } from '../middleware/auth';

// Create Task
export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, type, dueDate, priority, assignedMemberId, customerId } = req.body;

    if (!title || !dueDate || !assignedMemberId) {
      return res.status(400).json({ error: 'Title, due date, and assigned member are required' });
    }

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Validate assigned member exists in same org
    const assignee = await User.findOne({ _id: assignedMemberId, orgId: req.user.orgId });
    if (!assignee) {
      return res.status(400).json({ error: 'Assigned member does not exist in this organization' });
    }

    const newTask = new Task({
      orgId: req.user.orgId,
      title,
      description,
      type: type || 'task',
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      status: 'pending',
      assignedMemberId,
      customerId: customerId || undefined,
    });

    await newTask.save();

    // Create Notification if assigned to someone else
    if (assignedMemberId !== req.user.id) {
      const notification = new Notification({
        orgId: req.user.orgId,
        recipientId: assignedMemberId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${req.user.name} assigned a new task: "${title}".`,
        referenceId: newTask._id,
      });
      await notification.save();
    }

    res.status(201).json({ message: 'Task created successfully.', task: newTask });
  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get Tasks with filters
export const getTasks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { status, type, priority, timeFilter, assignedMemberId } = req.query;

    const query: any = { orgId: req.user.orgId };

    // Standard filters
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (priority) {
      query.priority = priority;
    }

    // Role-based scope (Executives/Viewers see their own tasks by default, Leaders/Managers see all unless filtered)
    if (assignedMemberId) {
      query.assignedMemberId = assignedMemberId;
    } else if (req.user.role === 'executive' || req.user.role === 'viewer') {
      query.assignedMemberId = req.user.id;
    }

    // Time filter logic
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (timeFilter === 'today') {
      query.dueDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (timeFilter === 'upcoming') {
      query.dueDate = { $gt: endOfToday };
    } else if (timeFilter === 'overdue') {
      query.dueDate = { $lt: startOfToday };
      query.status = 'pending'; // Overdue only makes sense if pending
    }

    const tasks = await Task.find(query)
      .populate('assignedMemberId', 'name email role')
      .populate('customerId', 'name company email')
      .sort({ dueDate: 1 });

    res.status(200).json({ tasks });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Update Task
export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const task = await Task.findOne({ _id: id, orgId: req.user.orgId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Viewers cannot modify tasks
    if (req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Forbidden: Viewers cannot edit tasks.' });
    }

    // Verify assigned member if updating
    if (updateFields.assignedMemberId && updateFields.assignedMemberId !== task.assignedMemberId.toString()) {
      const assignee = await User.findOne({ _id: updateFields.assignedMemberId, orgId: req.user.orgId });
      if (!assignee) {
        return res.status(400).json({ error: 'Assigned member does not exist in this organization' });
      }

      // Notify new assignee
      if (updateFields.assignedMemberId !== req.user.id) {
        const notification = new Notification({
          orgId: req.user.orgId,
          recipientId: updateFields.assignedMemberId,
          type: 'task_assigned',
          title: 'Task Reassigned',
          message: `${req.user.name} reassigned task "${task.title}" to you.`,
          referenceId: task._id,
        });
        await notification.save();
      }
    }

    // Apply updates
    Object.keys(updateFields).forEach((key) => {
      if (key !== 'orgId') {
        if (key === 'dueDate') {
          task.dueDate = new Date(updateFields.dueDate);
        } else {
          (task as any)[key] = updateFields[key];
        }
      }
    });

    await task.save();

    res.status(200).json({ message: 'Task updated successfully.', task });
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Delete Task
export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Viewers cannot delete tasks
    if (req.user.role === 'viewer') {
      return res.status(403).json({ error: 'Forbidden: Viewers cannot delete tasks.' });
    }

    const task = await Task.findOne({ _id: id, orgId: req.user.orgId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await Task.deleteOne({ _id: id });

    res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error: any) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
