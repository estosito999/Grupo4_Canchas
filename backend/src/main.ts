import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS: permite que el frontend (Next.js) llame a esta API desde el navegador
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Validación automática de DTOs en todas las rutas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve propiedades no incluidas en el DTO
      forbidNonWhitelisted: true, // Error si envían propiedades extra
      transform: true, // Transforma automáticamente los tipos de datos
    }),
  );

  // Aplica @Exclude() (oculta el password en las respuestas)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Documentación Swagger en /api
  const config = new DocumentBuilder()
    .setTitle('Sistema de Reservas de Canchas - API')
    .setDescription('Módulo de usuarios y autenticación (Grupo 4)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en puerto: ${port}`);
  console.log(`Documentación Swagger: http://localhost:${port}/api`);
}
bootstrap();
