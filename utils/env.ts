import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

export type Environment = 'staging' | 'production';

export const environment = (process.env.ENVIRONMENT || 'staging') as Environment;
export const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
export const apiVersion = process.env.API_VERSION || 'v2';
export const businessDate = process.env.BUSINESS_DATE || '2026-05-06';

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
