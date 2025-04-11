import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class VerifiedGuard implements CanActivate {
  constructor(private usersService: UsersService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userID = parseInt(request.user['sub']);

    const user = await this.usersService.findOne(userID);

    if (user?.isVerified) {
      return true;
    }

    throw new UnauthorizedException('User is not verified');
  }
}
