import { Test, TestingModule } from '@nestjs/testing';
import { ProducerService } from 'src/kafka/producer/producer.service';
import { MailService } from './mail.service';
import { MailConfigProviders } from './mailconfig/mailconfig.provider';
import { MailConfigService } from './mailconfig/mailconfig.service';

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService, ProducerService, MailConfigService, ...MailConfigProviders],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
