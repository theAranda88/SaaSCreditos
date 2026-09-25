import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import { AuthServicio } from './auth.servicio';
import type { AltaNegocioServicio } from './alta-negocio.servicio';

describe('AuthServicio', () => {
  let authServicio: AuthServicio;
  let usuarioRepositorio: UsuarioRepositorio;
  let altaNegocioServicio: AltaNegocioServicio;
  let jwtService: JwtService;

  beforeEach(() => {
    usuarioRepositorio = {
      buscarPorCorreo: vi.fn(),
      buscarPorId: vi.fn(),
      crear: vi.fn(),
      actualizarUltimoAcceso: vi.fn(),
    } as unknown as UsuarioRepositorio;

    altaNegocioServicio = {
      crearNegocioYPropietario: vi.fn(),
    } as unknown as AltaNegocioServicio;

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('token-jwt-falso'),
    } as unknown as JwtService;

    authServicio = new AuthServicio(usuarioRepositorio, altaNegocioServicio, jwtService);
  });

  it('debe rechazar login con credenciales inválidas', async () => {
    vi.mocked(usuarioRepositorio.buscarPorCorreo).mockResolvedValue(null);

    await expect(
      authServicio.iniciarSesion({
        correo: 'inexistente@ejemplo.com',
        contrasena: 'ClaveSegura123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('debe rechazar registro con correo duplicado', async () => {
    vi.mocked(altaNegocioServicio.crearNegocioYPropietario).mockRejectedValue(
      new ConflictException('El correo ya está registrado'),
    );

    await expect(
      authServicio.registrar({
        nombreComercial: 'Negocio Nuevo',
        nombre: 'Ana',
        correo: 'ana@ejemplo.com',
        contrasena: 'ClaveSegura123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
