import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'leader' | 'manager' | 'executive' | 'viewer';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  orgId: mongoose.Types.ObjectId;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['leader', 'manager', 'executive', 'viewer'],
      required: true,
      default: 'executive',
    },
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    delete ret.passwordHash;
    delete ret.verificationToken;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
