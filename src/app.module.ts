import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { RedisModule } from './redis/redis.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { FxRateModule } from './fxrate/fxrate.module';
import { CurrencyModule } from './currency/currency.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { VerifiedGuard } from './auth/verified-guard';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      global: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true, // Set to false in production
        logging: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    NotificationModule,
    RedisModule,
    CurrencyModule,
    WalletModule,
    TransactionModule,
    FxRateModule,
  ],
  controllers: [AppController],
  providers: [AppService, VerifiedGuard],
})
export class AppModule {}
