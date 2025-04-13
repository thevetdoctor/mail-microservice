import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { response } from 'oba-http-response';
import { Response } from 'express';
import { SamplePushDTO } from './notification.dto';

@Controller('notification')
@ApiBearerAuth('JWT')
export class NotificationController {
  private subscriptions: any[] = []; // temp in-memory store
  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  subscribe(@Body() body: any, @Res() res: Response) {
    try {
      // Save the subscription to DB or memory
      const isExisting = this.subscriptions.some(
        (sub) => sub.endpoint === body.endpoint,
      );

      if (!isExisting) {
        this.subscriptions.push(body);
        console.log('Subscription added:', body.endpoint);
      } else {
        console.log('Subscription already exists:', body.endpoint);
      }
      console.log(this.subscriptions, this.subscriptions.length);
      return response(
        res,
        HttpStatus.CREATED,
        null,
        null,
        'Subscription successful',
      );
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
      const failedSubscriptions: number[] = [];

      for (let i = 0; i < this.subscriptions.length; i++) {
        const sub = this.subscriptions[i];
        try {
          await this.notificationService.sendPushNotification(sub, message);
        } catch (error) {
          console.log('error', error.message);
          if (error.message.includes('expired')) {
            // Unsubscribe if push failed due to expiration
            failedSubscriptions.push(i);
          }
        }
      }

      // Remove expired subscriptions in reverse to avoid reindexing issues
      console.log('failedSubscriptions', failedSubscriptions.length);
      for (let i = failedSubscriptions.length - 1; i >= 0; i--) {
        this.subscriptions.splice(failedSubscriptions[i], 1);
      }

      console.log('active subscriptions', this.subscriptions.length);
      if (!this.subscriptions.length) {
        throw new BadRequestException('No active subscriptions available');
      }
      return response(
        res,
        HttpStatus.CREATED,
        null,
        null,
        `${this.subscriptions.length} Push notification(s) sent successfully`,
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
