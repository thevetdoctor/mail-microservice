import { Test, TestingModule } from '@nestjs/testing';
import { ProducerService } from 'src/kafka/producer/producer.service';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MailConfigProviders } from './mailconfig/mailconfig.provider';
import { MailConfigService } from './mailconfig/mailconfig.service';

describe('MailController', () => {
  let controller: MailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailController],
      providers: [
        MailService,
        ProducerService,
        MailConfigService,
        ...MailConfigProviders,
      ],
    }).compile();

    controller = module.get<MailController>(MailController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
