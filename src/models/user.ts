import mongoose, { Schema, Document, Model } from 'mongoose';
import AuthService from '../services/auth';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
}

interface UserModel extends Omit<IUser, '_id'>, Document {}

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform: (_, ret): void => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

schema.path('email').validate(
  async (email: string) => {
    const emailCount = await mongoose.models.User.countDocuments({ email });
    return !emailCount;
  },
  'already exists in the database.',
  'DUPLICATED'
);

schema.pre<UserModel>('save', async function (): Promise<void> {
  if (!this.password || !this.isModified('password')) return;

  try {
    const hashedPassword = await AuthService.hashPassword(this.password);
    this.password = hashedPassword;
  } catch (err) {
    console.error(`Error hashing the password for the user ${this.name}`);
  }
});

export const User: Model<UserModel> = mongoose.model('User', schema);
