import { Response } from 'express';
import ChatMessage from '../models/ChatMessage';
import { AuthenticatedRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// Get messages for a channel/DM
export const getMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Enforce DM privacy: if it's a DM, make sure the user is one of the participants
    if (channelId.startsWith('dm:')) {
      const parts = channelId.split(':');
      const user1 = parts[1];
      const user2 = parts[2];
      if (req.user.id !== user1 && req.user.id !== user2) {
        return res.status(403).json({ error: 'Forbidden: You are not a participant in this conversation.' });
      }
    }

    const messages = await ChatMessage.find({
      orgId: req.user.orgId,
      channelId,
    })
      .sort({ createdAt: 1 })
      .limit(100); // Retrieve last 100 messages

    res.status(200).json({ messages });
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Add emoji reaction
export const addReaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const message = await ChatMessage.findOne({ _id: messageId, orgId: req.user.orgId });
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user already reacted with this exact emoji
    const existingReactionIndex = message.emojiReactions.findIndex(
      (r: any) => r.userId.toString() === req.user?.id && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Remove reaction if clicked again (toggle)
      message.emojiReactions.splice(existingReactionIndex, 1);
    } else {
      // Add reaction
      message.emojiReactions.push({
        userId: new mongoose.Types.ObjectId(req.user.id),
        userName: req.user.name,
        emoji,
      });
    }

    await message.save();
    res.status(200).json({ message: 'Reaction toggled successfully.', chatMessage: message });
  } catch (error: any) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Mark messages as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const userIdObj = new mongoose.Types.ObjectId(req.user.id);

    // Add user ID to readBy array for all messages in the channel where it's not present
    await ChatMessage.updateMany(
      {
        orgId: req.user.orgId,
        channelId,
        senderId: { $ne: userIdObj },
        readBy: { $ne: userIdObj },
      },
      {
        $push: { readBy: userIdObj },
      }
    );

    res.status(200).json({ message: 'Messages marked as read.' });
  } catch (error: any) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
