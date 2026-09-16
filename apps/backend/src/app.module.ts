import { Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { GuardAutenticacion } from './nucleo/guards/guard-autenticacion';
import { GuardRoles } from './nucleo/guards/guard-roles';
import { RutasModule } from './routes/rutas.module';

@Module({
  imports: [RutasModule],
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
  ],
})
export class AppModule {}
