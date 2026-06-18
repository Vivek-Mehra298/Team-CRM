import mongoose, { Schema, Document } from 'mongoose';

export type CustomerStatus = 'lead' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';

export interface ICustomerFile {
  name: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface ICustomer extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  tags: string[];
  assignedMemberId?: mongoose.Types.ObjectId;
  status: CustomerStatus;
  files: ICustomerFile[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    address: { type: String, trim: true },
    notes: { type: String },
    tags: [{ type: String }],
    assignedMemberId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['lead', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'],
      default: 'lead',
      required: true,
    },
    files: [
      {
        name: { type: String, required: true },
        path: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

CustomerSchema.index({ orgId: 1, name: 1 });
CustomerSchema.index({ orgId: 1, status: 1 });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
