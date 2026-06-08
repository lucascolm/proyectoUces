import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';

import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { UsersMongooseDao } from './dao/users.moongoose.dao';


@Module({
  imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: 'IUsersRepository', useClass: UsersRepository },
    { provide: 'IUsersDao', useClass: UsersMongooseDao },
  ],
})
export class UsersModule {}
