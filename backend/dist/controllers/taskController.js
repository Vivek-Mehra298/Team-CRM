"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTasks = exports.createTask = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const User_1 = __importDefault(require("../models/User"));
const Notification_1 = __importDefault(require("../models/Notification"));
// Create Task
const createTask = async (req, res) => {
    try {
        const { title, description, type, dueDate, priority, assignedMemberId, customerId } = req.body;
        if (!title || !dueDate || !assignedMemberId) {
            return res.status(400).json({ error: 'Title, due date, and assigned member are required' });
        }
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Validate assigned member exists in same org
        const assignee = await User_1.default.findOne({ _id: assignedMemberId, orgId: req.user.orgId });
        if (!assignee) {
            return res.status(400).json({ error: 'Assigned member does not exist in this organization' });
        }
        const newTask = new Task_1.default({
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
            const notification = new Notification_1.default({
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
    }
    catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.createTask = createTask;
// Get Tasks with filters
const getTasks = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { status, type, priority, timeFilter, assignedMemberId } = req.query;
        const query = { orgId: req.user.orgId };
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
        }
        else if (req.user.role === 'executive' || req.user.role === 'viewer') {
            query.assignedMemberId = req.user.id;
        }
        // Time filter logic
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        if (timeFilter === 'today') {
            query.dueDate = { $gte: startOfToday, $lte: endOfToday };
        }
        else if (timeFilter === 'upcoming') {
            query.dueDate = { $gt: endOfToday };
        }
        else if (timeFilter === 'overdue') {
            query.dueDate = { $lt: startOfToday };
            query.status = 'pending'; // Overdue only makes sense if pending
        }
        const tasks = await Task_1.default.find(query)
            .populate('assignedMemberId', 'name email role')
            .populate('customerId', 'name company email')
            .sort({ dueDate: 1 });
        res.status(200).json({ tasks });
    }
    catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.getTasks = getTasks;
// Update Task
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const task = await Task_1.default.findOne({ _id: id, orgId: req.user.orgId });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Viewers cannot modify tasks
        if (req.user.role === 'viewer') {
            return res.status(403).json({ error: 'Forbidden: Viewers cannot edit tasks.' });
        }
        // Verify assigned member if updating
        if (updateFields.assignedMemberId && updateFields.assignedMemberId !== task.assignedMemberId.toString()) {
            const assignee = await User_1.default.findOne({ _id: updateFields.assignedMemberId, orgId: req.user.orgId });
            if (!assignee) {
                return res.status(400).json({ error: 'Assigned member does not exist in this organization' });
            }
            // Notify new assignee
            if (updateFields.assignedMemberId !== req.user.id) {
                const notification = new Notification_1.default({
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
                }
                else {
                    task[key] = updateFields[key];
                }
            }
        });
        await task.save();
        res.status(200).json({ message: 'Task updated successfully.', task });
    }
    catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.updateTask = updateTask;
// Delete Task
const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Viewers cannot delete tasks
        if (req.user.role === 'viewer') {
            return res.status(403).json({ error: 'Forbidden: Viewers cannot delete tasks.' });
        }
        const task = await Task_1.default.findOne({ _id: id, orgId: req.user.orgId });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        await Task_1.default.deleteOne({ _id: id });
        res.status(200).json({ message: 'Task deleted successfully.' });
    }
    catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.deleteTask = deleteTask;
