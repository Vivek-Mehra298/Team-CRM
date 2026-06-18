import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

export const connectDB = async () => {
  const uri = MONGODB_URI || 'mongodb://127.0.0.1:27017/teamcrm';

  if (!MONGODB_URI) {
    console.warn('[DB WARNING]: MONGODB_URI is not set. Defaulting to local MongoDB: ' + uri);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[DB]: Connected to MongoDB successfully.');
  } catch (error) {
    console.error('================================================================');
    console.error('[DB ERROR]: Could not connect to MongoDB. Error details:', error);
    console.error('[DB ADVICE]: Please make sure MongoDB is running locally or provide a valid MONGODB_URI in backend/.env');
    console.error('================================================================');
    process.exit(1);
  }
};
