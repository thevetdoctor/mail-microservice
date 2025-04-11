import * as dotenv from 'dotenv';
dotenv.config();

export const SEQUELIZE = 'SEQUELIZE';
export const DEVELOPMENT = 'development';
export const TEST = 'test';
export const PRODUCTION = 'production';
export const PERMISSION_REPOSITORY = 'PERMISSION_REPOSITORY';
export const ROLE_REPOSITORY = 'ROLE_REPOSITORY';
export const USER_ROLE_REPOSITORY = 'USER_ROLE_REPOSITORY';
export const ROLE_PERMISSION_REPOSITORY = 'ROLE_PERMISSION_REPOSITORY';
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const BLACKLISTED_TOKENS = 'BLACKLISTED_TOKENS';
export const TWO_FACTOR_TOKEN_REPOSITORY = 'TWO_FACTOR_TOKEN_REPOSITORY';
export const RESET_TOKEN_REPOSITORY = 'RESET_TOKEN_REPOSITORY';
export const MAIL_CONFIG_REPOSITORY = 'MAIL_CONFIG_REPOSITORY';
export const SUBSCRIPTION_REPOSITORY = 'SUBSCRIPTION_REPOSITORY';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 16;

// ENV Variables
export const appName = process.env.APP_NAME ?? 'MAIL_MICROSERVICE';
export const kafkaUrl = process.env.KAFKA_URL ?? '104.248.162.129:9092';
export const jwtSecret =
  process.env.JWT_SECRET ?? 'auth-microservice-secret-key';
export const expiryDuration = process.env.JWT_DURATION_EXPIRY
  ? String(process.env.JWT_DURATION_EXPIRY)
  : '1h';
export const dbSchema = process.env.DB_SCHEMA ? process.env.DB_SCHEMA : 'mail';
export const dbUrl =
  process.env.DB_URL || 'postgres://admin:strange@178.128.32.101:5432/micro-db';
export const apiGatewayUrl =
  process.env.API_GATEWAY_URL ?? 'https://gateway.softafrik.com';
export const redirectUrl = process.env.REDIRECT_URL ?? 'https://softafrik.com';
export const mailSMtpServer = process.env.MAIL_SMTP_SERVER ?? 'smtp.gmail.com';
export const mailPort = process.env.MAIL_PORT ?? 'Not Supplied';
export const encryptionKey = process.env.ENCRYPTION_KEY ?? 'undefinedkey';
export const emailUser = process.env.EMAIL_USER ?? 'Not Supplied';
export const emailPass = process.env.EMAIL_PASS ?? 'Not Supplied';
export const adminEmail = process.env.ADMIN_EMAIL ?? 'thevetdoctor@gmail.com';
export const port = process.env.PORT ?? 3002;
export const errorTimeLimit = process.env.ERROR_TIME_LIMIT
  ? Number(process.env.ERROR_TIME_LIMIT)
  : 60000;
export const MAX_ERRORS = process.env.MAX_ERRORS
  ? Number(process.env.ERROR_TIME_LIMIT)
  : 10;
export const DB_LOGGING = process.env.DB_LOGGING ? true : false;
export const NODE_ENV = process.env.NODE_ENV
  ? process.env.NODE_ENV
  : DEVELOPMENT;

export enum AppRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum NodeEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export enum KafkaTopics {
  MAIL_SEND = 'mail.send',
  MAIL_SEND_ERROR = 'mail.send.error',
  SUBMIT_FEEDBACK = 'submit.feedback',
  SUBMIT_FEEDBACK_ERROR = 'submit.feedback.error',
  MAIL_SENT = 'mail.sent',
  USER_LOGIN = 'user.login',
  USER_LOGIN_ERROR = 'user.login.error',
  USER_LOGIN_ERROR_ALERT = 'user.login.error.alert',
  USER_SIGNUP = 'user.signup',
  USER_SIGNUP_ERROR = 'user.signup.error',
}

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? 'Not Supplied';
export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ?? 'Not Supplied';

export const redisHost = process.env.REDIS_HOST || '172.17.0.1';
export const redisPort = process.env.REDIS_PORT
  ? Number(process.env.REDIS_PORT)
  : 6379;
export const redisPassword = process.env.REDIS_PASSWORD || undefined;
export const cacheTtl = process.env.CACHE_TTL
  ? Number(process.env.CACHE_TTL)
  : 30000;
