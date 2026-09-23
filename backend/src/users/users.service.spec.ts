import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { User, UserEstado, UserRole } from './entities/user.entity';
import { MailService } from '../mail/mail.service';

describe('UsersService', () => {
  let service: UsersService;
  let repositorio: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let mailService: { enviarCorreoBienvenida: jest.Mock };

  const dtoBase = {
    nombres: 'Ana',
    apellido_paterno: 'Perez',
    apellido_materno: 'Lopez',
    fecha_nacimiento: '1998-05-20',
    correo: 'ana@example.com',
    celular: '999888777',
    password: 'clave1234',
  };

  beforeEach(async () => {
    repositorio = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((datos: Partial<User>) => datos),
      save: jest.fn((datos: Partial<User>) =>
        Promise.resolve({ id: 'uuid-1', ...datos }),
      ),
      remove: jest.fn(),
    };
    mailService = { enviarCorreoBienvenida: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repositorio },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('RF02: rechaza un correo ya registrado', async () => {
    repositorio.findOne.mockResolvedValueOnce({ id: 'otro' });

    await expect(service.create(dtoBase)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('RF02: rechaza un celular ya registrado', async () => {
    repositorio.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'otro' });

    await expect(service.create(dtoBase)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('RNF01: guarda el hash bcrypt y nunca la contraseña en texto plano', async () => {
    repositorio.findOne.mockResolvedValue(null);

    const creado = await service.create(dtoBase);
    const guardado = repositorio.save.mock.calls[0][0] as User;

    expect(guardado.password_hash).not.toBe(dtoBase.password);
    expect(await bcrypt.compare(dtoBase.password, guardado.password_hash)).toBe(
      true,
    );
    expect(creado).not.toHaveProperty('password');
    expect(creado).not.toHaveProperty('password_hash');
  });

  it('RF05: el registro público siempre crea CLIENTE y en estado Activo', async () => {
    repositorio.findOne.mockResolvedValue(null);

    await service.create(
      { ...dtoBase, rol: UserRole.ADMINISTRADOR },
      UserRole.CLIENTE,
      false,
    );
    const guardado = repositorio.save.mock.calls[0][0] as User;

    expect(guardado.rol).toBe(UserRole.CLIENTE);
    expect(guardado.estado).toBe(UserEstado.ACTIVO);
  });

  it('RF04: dispara el correo de bienvenida', async () => {
    repositorio.findOne.mockResolvedValue(null);

    await service.create(dtoBase);

    expect(mailService.enviarCorreoBienvenida).toHaveBeenCalledWith(
      dtoBase.correo,
      dtoBase.nombres,
      UserRole.CLIENTE,
    );
  });

  it('RF08: el directorio solo consulta clientes', async () => {
    repositorio.find.mockResolvedValue([]);

    await service.getDirectory('ana');

    const opciones = repositorio.find.mock.calls[0][0] as {
      where: Array<Record<string, unknown>>;
    };
    expect(Array.isArray(opciones.where)).toBe(true);
    expect(
      opciones.where.every((condicion) => condicion.rol === UserRole.CLIENTE),
    ).toBe(true);
  });

  it('RF07: no permite que un administrador bloquee su propia cuenta', async () => {
    await expect(
      service.changeStatus('uuid-1', UserEstado.BLOQUEADO, 'uuid-1'),
    ).rejects.toThrow('No puedes bloquear tu propia cuenta');
  });
});
