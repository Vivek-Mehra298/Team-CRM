import crypto from 'crypto';

const DEFAULT_LOCAL_CLIENT_URL = 'http://localhost:3000';
const DEFAULT_PRODUCTION_CLIENT_URL = 'https://team-crm-nine.vercel.app';
let runtimeJwtSecret: string | undefined;

const parseList = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

const normalizeUrl = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? stripTrailingSlashes(trimmed) : undefined;
};

const normalizeOrigin = (value?: string) => {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return undefined;
  }

  try {
    return new URL(normalized).origin;
  } catch {
    return normalized;
  }
};

const defaultClientUrl =
  process.env.NODE_ENV === 'production'
    ? DEFAULT_PRODUCTION_CLIENT_URL
    : DEFAULT_LOCAL_CLIENT_URL;

export const CLIENT_URL = normalizeUrl(process.env.CLIENT_URL) || defaultClientUrl;

export const ALLOWED_ORIGINS = Array.from(
  new Set(
    [
      normalizeOrigin(CLIENT_URL),
      ...parseList(process.env.CORS_ORIGIN).map(normalizeOrigin),
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ]
      .filter((origin): origin is string => Boolean(origin))
  )
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
