import { Sequelize } from 'sequelize-typescript';
import { databaseConfig } from './config';
import {
  dbSchema,
  dbUrl,
  DB_LOGGING,
  DEVELOPMENT,
  NODE_ENV,
  parseDbUrl,
  PRODUCTION,
  SEQUELIZE,
  TEST,
} from 'src/utils';
import { MailConfigs } from 'src/mail/mailconfig/mailconfig.entity';
import { Subscriptions } from 'src/notification/notification.entity';

export const databaseProviders = [
  {
    provide: SEQUELIZE,
    useFactory: async () => {
      let config;
      switch (process.env.NODE_ENV) {
        case DEVELOPMENT:
        default:
          config = databaseConfig.development;
          break;
        case TEST:
          config = databaseConfig.test;
          break;
        case PRODUCTION:
          config = databaseConfig.production;
          break;
      }
      let sequelize: any;
      try {
        const prasedUrl = parseDbUrl(dbUrl);
        console.log('prasedUrl', prasedUrl);
        console.log('DB_LOGGING', DB_LOGGING);
        console.log('NODE_ENV', NODE_ENV);

        await (async function ensureSchemaExists() {
          const sequelize = new Sequelize(dbUrl, { logging: false });
          await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${dbSchema}";`);
          await sequelize.close();
          console.log('ensureSchemaExists Done');
        })();

        if (process.env.NODE_ENV !== 'test') {
          sequelize = new Sequelize(config.urlDatabase, {
            logging: false,
            dialectOptions: {
              ssl: false,
            },
            schema: dbSchema,
          });
        } else {
          sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: ':memory:',
            logging: false,
          });
        }
        sequelize.addModels([MailConfigs, Subscriptions]);

        try {
          await sequelize.sync({ alter: true });
        } catch (err) {
          console.error('DB sync failed:', err);
        }
      } catch (err) {
        console.error('Error with DB sync:', err);
        throw err; // Crash intentionally to let Docker logs show it
      }
      return sequelize;
    },
  },
];
