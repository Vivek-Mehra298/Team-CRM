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
  } catch (error: any) {
    console.error('================================================================');
    console.error('[DB ERROR]: Could not connect to MongoDB.');
    console.error('Error:', error.message);
    console.error('================================================================');
    console.error('[DB TROUBLESHOOTING]');
    console.error('1. Check MONGODB_URI in backend/.env is correct');
    console.error('2. Verify username and password are valid');
    console.error('3. Ensure IP is whitelisted in MongoDB Atlas');
    console.error('4. For local MongoDB: Run "mongod" and ensure it\'s running');
    console.error('5. Connection string format: mongodb+srv://username:password@cluster.mongodb.net/database');
    console.error('================================================================');
    process.exit(1);
  }
};
