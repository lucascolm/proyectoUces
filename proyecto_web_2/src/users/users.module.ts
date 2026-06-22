import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';

import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { UsersMongooseDao } from './dao/users.moongoose.dao';
import { PassportModule } from '@nestjs/passport';
import { JwtModule,JwtModuleOptions  } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';


@Module({
  imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        PassportModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '1h',
        } as any,
      }),
      inject: [ConfigService],    
    }),
  ],
  controllers: [UsersController,AuthController],
  providers: [
    UsersService,
    AuthService,
    { provide: 'IUsersRepository', useClass: UsersRepository },
    { provide: 'IUsersDao', useClass: UsersMongooseDao },
    JwtStrategy,
    LocalStrategy,
  ],
  exports: [UsersService, AuthService],
})
export class UsersModule {}
