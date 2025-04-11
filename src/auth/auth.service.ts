import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginAuthDto } from './dto/login-auth.dto';
import { LoginAuthResponseDto } from './dto/login-auth-response.dto';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { NotificationService } from 'src/notification/notification.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private redisService: RedisService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('email already exists');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = { ...createUserDto, password: hashedPassword };
    return await this.usersService.create(newUser);
  }

  async login(loginAuthDto: LoginAuthDto): Promise<LoginAuthResponseDto> {
    const user = await this.usersService.findOneByEmail(loginAuthDto.email);
    if (!user) {
      throw new UnauthorizedException('INVALID CREDENTIALS');
    }

    const isPasswordMatch = await bcrypt.compare(
      loginAuthDto.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('INVALID CREDENTIALS');
    }

    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async logout(id: number) {
    return `This action removes a #${id} auth`;
  }

  async generateEmailOtp(
    email: string,
  ): Promise<{ otp: string; secret: string }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('NO USER FOUND WITH EMAIL');
    }
    authenticator.options = { step: 180 };
    const secret = authenticator.generateSecret();
    const otp = authenticator.generate(secret);

    await this.redisService.set(email, secret, 240);
    return await this.notificationService.sendOtpEmail(
      email,
      user.firstName,
      otp,
    );
  }

  async verifyEmailOtp(email: string, token: string) {
    const secret = await this.redisService.get(email);

    if (!secret) {
      throw new UnauthorizedException('OTP invalid or has expired');
    }

    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      throw new UnauthorizedException('OTP invalid or has expired');
    }
    return this.usersService.validateEmail(email);
  }
}
