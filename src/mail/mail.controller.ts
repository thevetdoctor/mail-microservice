import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { response } from 'oba-http-response';
import { getIdentity, getLocation } from 'src/utils';
import { MailSendDTO } from './mail.dto';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  async externalMailSend(
    @Body() payload: MailSendDTO,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      let { clientIp: ip, deviceInfo } = getIdentity(req);
      const clientIp = await getLocation(ip);
      await this.mailService.externalSendMail(payload, clientIp, deviceInfo);

      return response(res, HttpStatus.CREATED, null, null, 'Mail submitted');
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
