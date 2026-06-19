"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = exports.ALLOWED_ORIGINS = exports.CLIENT_URL = void 0;
const DEFAULT_CLIENT_URL = 'http://localhost:3000';
const parseList = (value) => (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
exports.CLIENT_URL = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;
exports.ALLOWED_ORIGINS = Array.from(new Set([exports.CLIENT_URL, ...parseList(process.env.CORS_ORIGIN)]));
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production.');
    }
    return secret || 'supersecretkeyteamcrm';
};
exports.getJwtSecret = getJwtSecret;
