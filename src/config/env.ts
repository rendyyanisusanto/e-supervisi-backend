import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: optional('JWT_ACCESS_EXPIRES_IN', '1d'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  BCRYPT_SALT_ROUNDS: parseInt(optional('BCRYPT_SALT_ROUNDS', '10'), 10),

  UPLOAD_DIR: optional('UPLOAD_DIR', 'uploads'),
  APP_URL: optional('APP_URL', 'http://localhost:5000'),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),

  GATEWAY_URL: optional('GATEWAY_URL', 'https://wa-ppdb.simsmk.sch.id'),
  GATEWAY_USER: optional('GATEWAY_USER', ''),
  GATEWAY_PASS: optional('GATEWAY_PASS', ''),
  GATEWAY_SEND_PATH: optional('GATEWAY_SEND_PATH', '/send-message'),
  GATEWAY_TIMEOUT: parseInt(optional('GATEWAY_TIMEOUT', '15000'), 10),

  isDev: () => (process.env.NODE_ENV || 'development') === 'development',
  isProd: () => process.env.NODE_ENV === 'production',
};
