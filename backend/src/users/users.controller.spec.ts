import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard, RolesGuard } from './jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { findAll: jest.Mock; getDirectory: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn().mockResolvedValue([]),
      getDirectory: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('RF07: delega el listado completo de usuarios en el servicio', async () => {
    await expect(controller.findAll()).resolves.toEqual([]);
    expect(usersService.findAll).toHaveBeenCalled();
  });

  it('RF08: delega la búsqueda del directorio en el servicio', async () => {
    await expect(controller.getDirectory('ana')).resolves.toEqual([]);
    expect(usersService.getDirectory).toHaveBeenCalledWith('ana');
  });
});
