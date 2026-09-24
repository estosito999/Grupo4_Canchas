import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Habilitar CORS para comunicación con el frontend (Next.js en el puerto 3001)
  const origenesPermitidos = [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
  ];
  app.enableCors({
    origin: origenesPermitidos,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Habilitar validación automática de DTOs en todas las rutas (RNF04)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades no incluidas en el DTO
      forbidNonWhitelisted: true, // Retorna error si envían propiedades extra
      transform: true, // Transforma automáticamente los tipos de datos
    }),
  );

  // RNF01: la respuesta nunca expone password_hash (ver @Exclude en la entidad)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en puerto: ${port} (API bajo /api)`);
}
bootstrap();
