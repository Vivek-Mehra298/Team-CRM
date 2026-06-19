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

  if (process.env.NODE_ENV === 'production') {
    if (!runtimeJwtSecret) {
      runtimeJwtSecret = crypto.randomBytes(32).toString('hex');
      console.warn(
        '[AUTH WARNING]: JWT_SECRET is not set. Generated a temporary runtime secret; users will be logged out after every server restart. Set JWT_SECRET in Render for stable sessions.'
      );
    }

    return runtimeJwtSecret;
  }

  return 'supersecretkeyteamcrm';
};
