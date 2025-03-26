import { Test, TestingModule } from '@nestjs/testing';
import { MailConfigProviders } from './mailconfig.provider';
import { MailConfigService } from './mailconfig.service';

describe('MailconfigService', () => {
  let service: MailConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailConfigService, ...MailConfigProviders],
    }).compile();

    service = module.get<MailConfigService>(MailConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
