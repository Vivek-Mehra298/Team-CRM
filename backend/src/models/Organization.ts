import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
