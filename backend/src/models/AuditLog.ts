import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  orgId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName: string;
  action: string; // 'login', 'logout', 'create_customer', 'update_customer', 'delete_customer', 'role_change', 'data_deletion', etc.
  details: string;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ orgId: 1, action: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
