import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { MAIL_CONFIG_REPOSITORY } from 'src/utils';
import { MailConfigDTO } from './mailconfig.dto';
import { MailConfigs } from './mailconfig.entity';

@Injectable()
export class MailConfigService {
  constructor(
    @Inject(MAIL_CONFIG_REPOSITORY)
    private readonly mailConfigRepo: typeof MailConfigs,
  ) {}

  async getMailConfig(email: string): Promise<MailConfigs | null> {
    try {
      const mailConfig = await this.mailConfigRepo.findOne({
        where: { email },
        attributes: ['email', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass'],
        raw: true,
      });
      if (!mailConfig) {
        throw new UnauthorizedException('Mail Config not found');
      }
      return mailConfig;
    } catch (e) {
      throw e;
    }
  }

  async generateMailConfig(payload: MailConfigDTO): Promise<MailConfigs> {
    try {
      const mailConfig = await this.mailConfigRepo.create({ ...payload });
      return mailConfig;
    } catch (e) {
      throw e;
    }
  }
}
