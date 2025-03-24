import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class MailConfigDTO {
  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'User email is required' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'smtpHost is required' })
  smtpHost?: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'smtpPort is required' })
  smtpPort?: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'smtpUser is required' })
  smtpUser: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'smtpPass is required' })
  smtpPass: string;
}
