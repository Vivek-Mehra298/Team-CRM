"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = exports.ALLOWED_ORIGINS = exports.CLIENT_URL = void 0;
const crypto_1 = __importDefault(require("crypto"));
const DEFAULT_CLIENT_URL = 'http://localhost:3000';
let runtimeJwtSecret;
const parseList = (value) => (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
exports.CLIENT_URL = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;
exports.ALLOWED_ORIGINS = Array.from(new Set([exports.CLIENT_URL, ...parseList(process.env.CORS_ORIGIN)]));
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (secret) {
        return secret;
    }
    if (process.env.NODE_ENV === 'production') {
        if (!runtimeJwtSecret) {
            runtimeJwtSecret = crypto_1.default.randomBytes(32).toString('hex');
            console.warn('[AUTH WARNING]: JWT_SECRET is not set. Generated a temporary runtime secret; users will be logged out after every server restart. Set JWT_SECRET in Render for stable sessions.');
        }
        return runtimeJwtSecret;
    }
    return 'supersecretkeyteamcrm';
};
exports.getJwtSecret = getJwtSecret;
