import { MAIL_CONFIG_REPOSITORY } from 'src/utils';
import { MailConfigs } from './mailconfig.entity';

export const MailConfigProviders = [
  {
    provide: MAIL_CONFIG_REPOSITORY,
    useValue: MailConfigs,
  },
];
