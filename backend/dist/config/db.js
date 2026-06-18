"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MONGODB_URI = process.env.MONGODB_URI || '';
const connectDB = async () => {
    const uri = MONGODB_URI || 'mongodb://127.0.0.1:27017/teamcrm';
    if (!MONGODB_URI) {
        console.warn('[DB WARNING]: MONGODB_URI is not set. Defaulting to local MongoDB: ' + uri);
    }
    try {
        await mongoose_1.default.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('[DB]: Connected to MongoDB successfully.');
    }
    catch (error) {
        console.error('================================================================');
        console.error('[DB ERROR]: Could not connect to MongoDB. Error details:', error);
        console.error('[DB ADVICE]: Please make sure MongoDB is running locally or provide a valid MONGODB_URI in backend/.env');
        console.error('================================================================');
        process.exit(1);
    }
};
exports.connectDB = connectDB;
