import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { UserRole } from './users/entities/user.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const users = app.get(UsersService);

  const email = process.env.ADMIN_EMAIL ?? 'admin@canchas.com';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin123456';

  const existing = await users.findByEmail(email);
  if (existing) {
    console.log(`El administrador ${email} ya existe.`);
  } else {
    const admin = await users.create({ name: 'Administrador', email, password });
    await users.setRole(admin.id, UserRole.ADMIN);
    console.log(`Administrador creado: ${email}`);
  }

  await app.close();
}
seed();