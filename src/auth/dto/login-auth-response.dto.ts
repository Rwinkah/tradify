import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/users/dto/user-response.dto';

export class LoginAuthResponseDto {
  @ApiProperty()
  access_token: String;

  @ApiProperty()
  user: UserResponseDto;
}
