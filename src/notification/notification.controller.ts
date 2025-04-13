import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { response } from 'oba-http-response';
import { Response } from 'express';
import { SamplePushDTO, SampleSubscriptionDTO } from './notification.dto';
import { getIdentity } from 'src/utils';

@Controller('notification')
@ApiBearerAuth('JWT')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  async subscribe(
    @Body() body: SampleSubscriptionDTO,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const { clientIp, deviceInfo } = getIdentity(req);
      body.userAgent = deviceInfo;
      const subscribed = await this.notificationService.subscribe(body);
      if (subscribed) {
        return response(
          res,
          HttpStatus.CREATED,
          null,
          null,
          'Subscription successful',
        );
      } else {
        return response(res, HttpStatus.OK, null, null, 'Subscription exist');
      }
    } catch (e) {
      return response(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        `Subscription error: ${e.message}`,
        e.message,
      );
    }
  }

  @Post('notify')
  async notifyAll(@Body() message: SamplePushDTO, @Res() res: Response) {
    try {
      const subscriptions = await this.notificationService.notifyAll(message);
      console.log('active subscriptions', subscriptions.length);

      if (!subscriptions.length) {
        throw new BadRequestException('No active subscriptions available');
      }
      return response(
        res,
        HttpStatus.CREATED,
        null,
        null,
        `${subscriptions.length} Push notification(s) sent successfully`,
      );
    } catch (e) {
      return response(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        `Push notification error: ${e.message}`,
        e.message,
      );
    }
  }

  @Get('subscriptions')
  async getSubscriptions(@Res() res: Response) {
    try {
      const subscriptions = await this.notificationService.getSubscriptions();
      return response(
        res,
        HttpStatus.OK,
        null,
        null,
        `${subscriptions.length} subscription(s)`,
      );
    } catch (e) {
      return response(
        res,
        HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        `Push notification error: ${e.message}`,
        e.message,
      );
    }
  }
}
