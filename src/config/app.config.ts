import 'dotenv/config' // Load environment variables

import { config as dotenvConfig } from 'dotenv'

dotenvConfig() // Load environment variables from .env file

import { getEnv } from '../common/utils/get-env'

// Declaring a function that returns an object with application configurations. This allows for a centralized and reusable configuration setup. so we use this not to access the env directly

const appConfig = () => ({
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  APP_ORIGIN: getEnv('APP_ORIGIN', 'localhost'),
  PORT: getEnv('PORT', '5000'),
  BASE_PATH: getEnv('BASE_PATH', '/api/v1'),
  MONGO_URI: getEnv('MONGO_URI'),

  JWT: {
    SECRET: getEnv('JWT_SECRET'),
    EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '15m'),
    REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET'),
    REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  MAILER_SENDER: getEnv('MAILER_SENDER'),
  RESEND_API_KEY: getEnv('RESEND_API_KEY'),
})

export const config = appConfig()
