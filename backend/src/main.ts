import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar validación automática de DTOs en todas las rutas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades no incluidas en el DTO
      forbidNonWhitelisted: true, // Retorna error si envían propiedades extra
      transform: true, // Transforma automáticamente los tipos de datos
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en puerto: ${port}`);
}
bootstrap();
