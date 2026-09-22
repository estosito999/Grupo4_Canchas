// auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secreto_super_seguro',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  // Exportar los módulos para que estén disponibles donde se importe AuthModule
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}