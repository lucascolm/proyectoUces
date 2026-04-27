import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { Users}Service } from './users}/users}.service';

@Module({
  imports: [UsersModule],
  controllers: [AppController],
  providers: [AppService, Users}Service],
})
export class AppModule {}
