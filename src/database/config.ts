import * as dotenv from 'dotenv';
import { dbUrl } from 'src/utils';
import { IDbConfig } from './interfaces/config.interface';

dotenv.config();

export const databaseConfig: IDbConfig = {
  development: {
    urlDatabase: dbUrl,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
  },
  test: {
    urlDatabase: process.env.DB_URL,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
  },
  production: {
    urlDatabase: process.env.DB_URL,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME_PRODUCTION,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
  },
};
// console.log(databaseConfig[process.env.NODE_ENV || 'development']);
