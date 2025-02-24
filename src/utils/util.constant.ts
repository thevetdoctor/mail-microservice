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

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 16;

// ENV Variables
export const appName = process.env.APP_NAME ?? 'MAIL_MICROSERVICE';
export const kafkaUrl = process.env.KAFKA_URL ?? '104.248.162.129:9092';
export const jwtSecret = process.env.JWT_SECRET ?? 'auth-microservice-secret-key';
export const expiryDuration = process.env.JWT_DURATION_EXPIRY
  ? String(process.env.JWT_DURATION_EXPIRY)
  : '1h';
export const redirectUrl = process.env.REDIRECT_URL ?? 'https://softafrik.com';
export const mailSMtpServer = process.env.MAIL_SMTP_SERVER ?? 'smtp.gmail.com';
export const mailPort = process.env.MAIL_PORT ?? 'Not Supplied';
export const emailUser = process.env.EMAIL_USER ?? 'Not Supplied';
export const emailPass = process.env.EMAIL_PASS ?? 'Not Supplied';
export const adminEmail = process.env.ADMIN_EMAIL ?? 'thevetdoctor@gmail.com';
export const errorTimeLimit = process.env.ERROR_TIME_LIMIT
  ? Number(process.env.ERROR_TIME_LIMIT)
  : 60000;
export const MAX_ERRORS = process.env.MAX_ERRORS
  ? Number(process.env.ERROR_TIME_LIMIT)
  : 10;

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
  MAIL_SENT = 'mail.sent',
  USER_LOGIN = 'user.login',
  USER_LOGIN_ERROR = 'user.login.error',
  USER_LOGIN_ERROR_ALERT = 'user.login.error.alert',
  USER_SIGNUP = 'user.signup',
  USER_SIGNUP_ERROR = 'user.signup.error',
}
