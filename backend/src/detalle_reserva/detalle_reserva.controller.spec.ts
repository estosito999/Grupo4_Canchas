import { Test, TestingModule } from '@nestjs/testing';
import { DetalleReservaController } from './detalle_reserva.controller';
import { DetalleReservaService } from './detalle_reserva.service';

describe('DetalleReservaController', () => {
  let controller: DetalleReservaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DetalleReservaController],
      providers: [DetalleReservaService],
    }).compile();

    controller = module.get<DetalleReservaController>(DetalleReservaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
