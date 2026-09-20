import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

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

  // Aplica @Exclude() de class-transformer (oculta el password en las respuestas)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en puerto: ${port}`);
}
bootstrap();