import { Response } from 'express';
import Notification from '../models/Notification';
import { AuthenticatedRequest } from '../middleware/auth';

// Get notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await Notification.find({
      recipientId: req.user.id,
      orgId: req.user.orgId,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      orgId: req.user.orgId,
      isRead: false,
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Mark single notification as read
export const markRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const notification = await Notification.findOne({
      _id: id,
      recipientId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Mark all as read
export const markAllRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    await Notification.updateMany(
      { recipientId: req.user.id, orgId: req.user.orgId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
