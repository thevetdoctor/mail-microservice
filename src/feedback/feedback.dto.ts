import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class FeedbackDTO {
  @ApiProperty({
    example: 'consultoba',
    description: 'User name',
  })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'consultoba@gmail.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'hello, i need some service',
    description: 'feedback message',
  })
  @IsNotEmpty({ message: 'Message is required' })
  message: string;

  @ApiProperty({
    example: 'Softafrik',
    description: 'Optional Sender Identity',
  })
  from: string;
}
