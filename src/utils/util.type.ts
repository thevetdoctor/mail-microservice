import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseTypeDTO {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ enum: HttpStatus })
  code: HttpStatus;

  @ApiProperty()
  message: string;
}

class PushMessage {
  @ApiProperty({ example: 'New Notification' })
  title: string;

  @ApiProperty({ example: 'You have an update!' })
  message: string;
}

export class SamplePushDTO {
  @ApiProperty({ type: PushMessage })
  message: PushMessage;
}
