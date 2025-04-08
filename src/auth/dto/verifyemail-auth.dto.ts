import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class VerifyEmailAuthDto {
  @ApiProperty()
  @IsString()
  otp: string;
}
