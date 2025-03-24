import { Test, TestingModule } from '@nestjs/testing';
import { MailconfigService } from './mailconfig.service';

describe('MailconfigService', () => {
  let service: MailconfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailconfigService],
    }).compile();

    service = module.get<MailconfigService>(MailconfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
