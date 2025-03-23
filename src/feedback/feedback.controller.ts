import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { FeedbackDTO } from './feedback.dto';
import { Request, Response } from 'express';
import { FeedbackService } from './feedback.service';
import { response } from 'oba-http-response';
import { getIdentity, getLocation } from 'src/utils';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('feedback')
@ApiBearerAuth('JWT')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async submitFeedback(
    @Body() payload: FeedbackDTO,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      let { clientIp: ip, deviceInfo } = getIdentity(req);
      const clientIp = await getLocation(ip);
      await this.feedbackService.submitFeedback(payload, clientIp, deviceInfo);

      return response(
        res,
        HttpStatus.CREATED,
        null,
        null,
        'Feedback submitted',
      );
    } catch (e) {
      return response(
        res,
        e.response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
        null,
        e.message,
      );
    }
  }
}
