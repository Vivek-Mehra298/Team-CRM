import mongoose, { Schema, Document } from 'mongoose';

export interface IEmojiReaction {
  userId: mongoose.Types.ObjectId;
  userName: string;
  emoji: string;
}

export interface IChatMessage extends Document {
  orgId: mongoose.Types.ObjectId;
  channelId: string; // 'general', 'announcements', or 'dm:userId1:userId2'
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  content: string;
  emojiReactions: IEmojiReaction[];
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    channelId: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    content: { type: String, required: true },
    emojiReactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        emoji: { type: String, required: true },
      },
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

ChatMessageSchema.index({ orgId: 1, channelId: 1, createdAt: 1 });

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
