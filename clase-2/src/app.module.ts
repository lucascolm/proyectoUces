import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';

@Module({
  imports: [UsersModule,

    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    })
    // MongooseModule.forRootAsync({
    //   useFactory: () => ({
    //     // Pones el string directamente aquí, sin el .get()
    //     uri: 'mongodb+srv://admin:1234@cluster0.pekqygy.mongodb.net/tu_base_de_datos?appName=Cluster0',
    //   }),
    // })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
