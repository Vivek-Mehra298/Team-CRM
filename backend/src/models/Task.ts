import mongoose, { Schema, Document } from 'mongoose';

export type TaskType = 'task' | 'followup' | 'meeting';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface ITask extends Document {
  orgId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: TaskType;
  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
  assignedMemberId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['task', 'followup', 'meeting'],
      required: true,
      default: 'task',
    },
    dueDate: { type: Date, required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      required: true,
      default: 'pending',
    },
    assignedMemberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  },
  { timestamps: true }
);

TaskSchema.index({ orgId: 1, assignedMemberId: 1, dueDate: 1 });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
