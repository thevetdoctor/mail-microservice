import { Injectable } from '@nestjs/common';
import { appName } from './utils';

@Injectable()
export class AppService {
  getHello(): { message: string } {
    return { message: `Welcome to the ${appName}` };
  }
}
