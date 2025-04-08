import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/_common/decorators/public.decorator';
import { LoginAuthDto } from './dto/login-auth.dto';
import { VerifyEmailAuthDto } from './dto/verifyemail-auth.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @Post('/register')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.authService.register(createUserDto);
  }

  @Public()
  @ApiOperation({ summary: 'Login an existing user' })
  @Post('/login')
  async login(@Body() loginAuthDto: LoginAuthDto) {
    return await this.authService.login(loginAuthDto);
  }

  @Get('/verify-email')
  @ApiOperation({ summary: 'Verify email for an existing user' })
  async verifyEmail(@Req() req) {
    const user = req.user;
    return await this.authService.generateEmailOtp(user.email);
  }

  @Post('/verify')
  @ApiOperation({ summary: 'Verify email for an existing user' })
  async validateEmail(
    @Req() req,
    @Body() verifyEmailAuthDto: VerifyEmailAuthDto,
  ) {
    const user = req.user;

    return await this.authService.verifyEmailOtp(
      user.email,
      verifyEmailAuthDto.otp,
    );
  }
}
