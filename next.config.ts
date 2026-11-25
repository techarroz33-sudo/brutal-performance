import type { NextConfig } from 'next';

const appUrlHost = (() => {
  const raw = process.env.APP_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

const allowedDevOrigins = [
  'localhost',
  '127.0.0.1',
  '**.run.app',
  '**.google.com',
  '**.corp.google.com',
  '**.googlers.com',
  ...(appUrlHost ? [appUrlHost] : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
