import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class MailSendDTO {
  @ApiProperty({
    example: 'consultoba',
    description: 'User name',
  })
  @IsNotEmpty({ message: 'Sender is required' })
  sender: string;

  @ApiProperty({
    example: 'consultoba@gmail.com',
    description: 'Sender email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Sender Email is required' })
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
    example: '<html></html>>',
    description: 'HTML template string',
  })
  template?: string;
}
