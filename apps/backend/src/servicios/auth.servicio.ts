import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PayloadJwt, PerfilUsuario, RespuestaLogin } from '@creditos/shared-types';
import * as bcrypt from 'bcrypt';
import { PrismaServicio } from '../bd/prisma.servicio';
import type { LoginDto } from '../dtos/login.dto';
import type { RegistroDto } from '../dtos/registro.dto';
import { NegocioRepositorio } from '../entidades/negocio.repositorio';
import { UsuarioRepositorio } from '../entidades/usuario.repositorio';

const RONDAS_BCRYPT = 12;

@Injectable()
export class AuthServicio {
  constructor(
    @Inject(PrismaServicio) private readonly prisma: PrismaServicio,
    @Inject(UsuarioRepositorio) private readonly usuarioRepositorio: UsuarioRepositorio,
    @Inject(NegocioRepositorio) private readonly negocioRepositorio: NegocioRepositorio,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: RegistroDto): Promise<RespuestaLogin> {
    const correoNormalizado = dto.correo.trim().toLowerCase();
    const existente = await this.usuarioRepositorio.buscarPorCorreo(correoNormalizado);

    if (existente) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashContrasena = await bcrypt.hash(dto.contrasena, RONDAS_BCRYPT);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const negocio = await tx.negocio.create({
        data: {
          nombreComercial: dto.nombreComercial.trim(),
          moneda: dto.moneda ?? 'COP',
          configuracion: {},
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          negocioId: negocio.id,
          nombre: dto.nombre.trim(),
          correo: correoNormalizado,
          hashContrasena,
          rol: 'propietario',
          telefono: dto.telefono?.trim() ?? null,
        },
      });

      return { negocio, usuario };
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
