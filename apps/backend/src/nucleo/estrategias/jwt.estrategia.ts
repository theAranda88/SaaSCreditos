import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { PayloadJwt } from '@creditos/shared-types';
import { UsuarioRepositorio } from '../../entidades/usuario.repositorio';
import type { UsuarioSolicitud } from '../tipos/usuario-solicitud';

@Injectable()
export class JwtEstrategia extends PassportStrategy(Strategy) {
  constructor(@Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRETO ?? 'secreto-dev-tests',
    });
  }

  async validate(payload: PayloadJwt): Promise<UsuarioSolicitud> {
    const usuario = await this.usuarioRepositorio.buscarPorId(payload.sub);

    if (!usuario || usuario.estado !== 'activo') {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    if (usuario.negocioId !== payload.negocio_id) {
      throw new UnauthorizedException('Token inconsistente con el negocio');
    }

    if (usuario.rol !== payload.rol) {
      throw new UnauthorizedException('Token inconsistente con el rol');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      negocio_id: usuario.negocioId,
    };
  }
}
