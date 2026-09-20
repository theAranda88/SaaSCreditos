import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { BdModule } from './bd/bd.module';
import { PrismaServicio } from './bd/prisma.servicio';
import { GuardAutenticacion } from './nucleo/guards/guard-autenticacion';
import { GuardNegocioOperativo } from './nucleo/guards/guard-negocio-operativo';
import { GuardRoles } from './nucleo/guards/guard-roles';
import { RutasModule } from './routes/rutas.module';

@Module({
  imports: [BdModule, RutasModule],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new GuardAutenticacion(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new GuardRoles(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, prisma: PrismaServicio) =>
        new GuardNegocioOperativo(reflector, prisma),
      inject: [Reflector, PrismaServicio],
    },
  ],
})
export class AppModule {}
