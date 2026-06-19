import crypto from 'crypto';

const DEFAULT_CLIENT_URL = 'http://localhost:3000';
let runtimeJwtSecret: string | undefined;

const parseList = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const CLIENT_URL = process.env.CLIENT_URL || DEFAULT_CLIENT_URL;

export const ALLOWED_ORIGINS = Array.from(
  new Set([CLIENT_URL, ...parseList(process.env.CORS_ORIGIN)])
);

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  // In production, throw error if JWT_SECRET is not set
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable must be set in production. Please set it in your Render environment variables.'
    );
  }

  // Development fallback
  return 'supersecretkeyteamcrm';
};
