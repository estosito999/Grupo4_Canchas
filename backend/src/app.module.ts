import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ReservaModule } from './reserva/reserva.module';
import { DetalleReservaModule } from './detalle_reserva/detalle_reserva.module';

@Module({
  imports: [
    // 1. Cargar variables de entorno del .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 2. Conexión a PostgreSQL vía TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('123456'),//PASSWORD
        database: configService.get<string>('complejo_deprtivo'),//DB_DATABASE
        autoLoadEntities: true,
        synchronize: true, // Sincroniza automáticamente los modelos con las tablas de PostgreSQL
      }),
    }),
    UsersModule,
    ReservaModule,
    DetalleReservaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
