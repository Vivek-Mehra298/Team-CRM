import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'customer_assigned' | 'task_assigned' | 'customer_updated' | 'deal_won' | 'new_message';

export interface INotification extends Document {
  orgId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  referenceId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['customer_assigned', 'task_assigned', 'customer_updated', 'deal_won', 'new_message'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, required: true },
    referenceId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
