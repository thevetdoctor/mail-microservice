import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class MailSendDTO {
  @ApiProperty({
    example: 'Innovantics Ltd',
    description: 'Sender identity or email address',
  })
  @IsNotEmpty({ message: 'Sender Identity or Email is required' })
  from: string;

  @ApiProperty({
    example: 'consultoba@gmail.com',
    description: 'Recepient email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Recepient Email is required' })
  to: string;

  @ApiProperty({
    example: 'hello, i need some service',
    description: 'Mail message',
  })
  @IsNotEmpty({ message: 'Message is required' })
  message: string;

  @ApiProperty({
    example: '<p>Please login with the OTP below<p><p>Token: 12345678</p>',
    description: 'HTML template string without the html tags',
  })
  template?: string;
}
