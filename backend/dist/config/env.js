"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJwtSecret = exports.ALLOWED_ORIGINS = exports.CLIENT_URL = void 0;
const DEFAULT_LOCAL_CLIENT_URL = 'http://localhost:3000';
const DEFAULT_PRODUCTION_CLIENT_URL = 'https://team-crm-nine.vercel.app';
let runtimeJwtSecret;
const parseList = (value) => (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
const stripTrailingSlashes = (value) => value.replace(/\/+$/, '');
const normalizeUrl = (value) => {
    const trimmed = value?.trim();
    return trimmed ? stripTrailingSlashes(trimmed) : undefined;
};
const normalizeOrigin = (value) => {
    const normalized = normalizeUrl(value);
    if (!normalized) {
        return undefined;
    }
    try {
        return new URL(normalized).origin;
    }
    catch {
        return normalized;
    }
};
const defaultClientUrl = process.env.NODE_ENV === 'production'
    ? DEFAULT_PRODUCTION_CLIENT_URL
    : DEFAULT_LOCAL_CLIENT_URL;
exports.CLIENT_URL = normalizeUrl(process.env.CLIENT_URL) || defaultClientUrl;
exports.ALLOWED_ORIGINS = Array.from(new Set([normalizeOrigin(exports.CLIENT_URL), ...parseList(process.env.CORS_ORIGIN).map(normalizeOrigin)]
    .filter((origin) => Boolean(origin))));
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (secret) {
        return secret;
    }
    // In production, throw error if JWT_SECRET is not set
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET environment variable must be set in production. Please set it in your Render environment variables.');
    }
    // Development fallback
    return 'supersecretkeyteamcrm';
};
exports.getJwtSecret = getJwtSecret;
