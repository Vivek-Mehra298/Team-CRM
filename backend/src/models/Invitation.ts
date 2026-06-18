import mongoose, { Schema, Document } from 'mongoose';

export interface IInvitation extends Document {
  email: string;
  orgId: mongoose.Types.ObjectId;
  role: 'leader' | 'manager' | 'executive' | 'viewer';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    role: { type: String, enum: ['leader', 'manager', 'executive', 'viewer'], required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema);
