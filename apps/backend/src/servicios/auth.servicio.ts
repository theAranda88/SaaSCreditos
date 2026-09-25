import {
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PayloadJwt, PerfilUsuario, RespuestaLogin } from '@creditos/shared-types';
import type { LoginDto } from '../dtos/login.dto';
import type { RegistroDto } from '../dtos/registro.dto';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { AltaNegocioServicio } from './alta-negocio.servicio';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthServicio {
  constructor(
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
    @Inject(AltaNegocioServicio) private readonly altaNegocioServicio: AltaNegocioServicio,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: RegistroDto): Promise<RespuestaLogin> {
    const resultado = await this.altaNegocioServicio.crearNegocioYPropietario({
      nombreComercial: dto.nombreComercial,
      nombre: dto.nombre,
      correo: dto.correo,
      contrasena: dto.contrasena,
      moneda: dto.moneda,
      telefono: dto.telefono,
    });

    const perfil = this.mapearPerfil(resultado.usuario);
    const token = await this.emitirToken(perfil);

    return { token, usuario: perfil };
  }

  async iniciarSesion(dto: LoginDto): Promise<RespuestaLogin> {
    const correoNormalizado = dto.correo.trim().toLowerCase();
    const usuario = await this.usuarioRepositorio.buscarPorCorreo(correoNormalizado);

    if (!usuario || usuario.estado !== 'activo') {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const contrasenaValida = await bcrypt.compare(dto.contrasena, usuario.hashContrasena);

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.usuarioRepositorio.actualizarUltimoAcceso(usuario.id);

    const perfil = this.mapearPerfil(usuario);
    const token = await this.emitirToken(perfil);

    return { token, usuario: perfil };
  }

  async recuperarAcceso(correo: string): Promise<{ mensaje: string }> {
    return {
      mensaje: `Si ${correo.trim().toLowerCase()} está registrado, recibirá instrucciones (stub MVP).`,
    };
  }

  obtenerPerfil(usuario: PerfilUsuario): PerfilUsuario {
    return usuario;
  }

  cerrarSesion(): { mensaje: string } {
    return { mensaje: 'Sesión cerrada. Descarte el token en el cliente.' };
  }

  private async emitirToken(perfil: PerfilUsuario): Promise<string> {
    const payload: PayloadJwt = {
      sub: perfil.id,
      negocio_id: perfil.negocio_id,
      rol: perfil.rol,
    };

    return this.jwtService.signAsync(payload);
  }

  private mapearPerfil(usuario: {
    id: string;
    nombre: string;
    correo: string;
    rol: PerfilUsuario['rol'];
    negocioId: string | null;
  }): PerfilUsuario {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      negocio_id: usuario.negocioId,
    };
  }
}
