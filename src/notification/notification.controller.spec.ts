import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationProviders } from './notification.provider';
import { NotificationService } from './notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [NotificationService, ...NotificationProviders]
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
