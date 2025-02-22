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
