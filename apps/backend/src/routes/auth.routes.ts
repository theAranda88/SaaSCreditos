import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthControlador } from '../controladores/auth.controlador';
import { EntidadesModule } from '../entidades/entidades.module';
import { JwtEstrategia } from '../nucleo/estrategias/jwt.estrategia';
import { AuthServicio } from '../servicios/auth.servicio';

@Module({
  imports: [
    EntidadesModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRETO ?? 'secreto-dev-tests',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthControlador],
  providers: [AuthServicio, JwtEstrategia],
  exports: [AuthServicio, JwtModule, JwtEstrategia],
})
export class AuthRoutes {}
