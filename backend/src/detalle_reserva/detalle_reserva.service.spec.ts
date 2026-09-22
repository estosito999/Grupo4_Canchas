import { Test, TestingModule } from '@nestjs/testing';
import { DetalleReservaService } from './detalle_reserva.service';

describe('DetalleReservaService', () => {
  let service: DetalleReservaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DetalleReservaService],
    }).compile();

    service = module.get<DetalleReservaService>(DetalleReservaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
