import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE || '.env' });

const env = {
  environment: process.env.ENVIRONMENT || 'staging',
  baseUrl: process.env.BASE_URL || 'http://localhost:8080',
  TARGET_ROLES_FILTER: process.env.TARGET_ROLES_FILTER || ''
};

export default env;