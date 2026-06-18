"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllRead = exports.markRead = exports.getNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
// Get notifications
const getNotifications = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const notifications = await Notification_1.default.find({
            recipientId: req.user.id,
            orgId: req.user.orgId,
        })
            .sort({ createdAt: -1 })
            .limit(50);
        const unreadCount = await Notification_1.default.countDocuments({
            recipientId: req.user.id,
            orgId: req.user.orgId,
            isRead: false,
        });
        res.status(200).json({ notifications, unreadCount });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.getNotifications = getNotifications;
// Mark single notification as read
const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const notification = await Notification_1.default.findOne({
            _id: id,
            recipientId: req.user.id,
        });
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        notification.isRead = true;
        await notification.save();
        res.status(200).json({ message: 'Notification marked as read', notification });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.markRead = markRead;
// Mark all as read
const markAllRead = async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        await Notification_1.default.updateMany({ recipientId: req.user.id, orgId: req.user.orgId, isRead: false }, { $set: { isRead: true } });
        res.status(200).json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.markAllRead = markAllRead;
