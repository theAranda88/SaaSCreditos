import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaServicio } from '../bd/prisma.servicio';
import { AuthServicio } from './auth.servicio';
import type { UsuarioRepositorio } from '../entidades/usuario.repositorio';
import type { NegocioRepositorio } from '../entidades/negocio.repositorio';

describe('AuthServicio', () => {
  let authServicio: AuthServicio;
  let usuarioRepositorio: UsuarioRepositorio;
  let prisma: PrismaServicio;
  let jwtService: JwtService;

  beforeEach(() => {
    usuarioRepositorio = {
      buscarPorCorreo: vi.fn(),
      buscarPorId: vi.fn(),
      crear: vi.fn(),
      actualizarUltimoAcceso: vi.fn(),
    } as unknown as UsuarioRepositorio;

    prisma = {
      $transaction: vi.fn(),
    } as unknown as PrismaServicio;

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('token-jwt-falso'),
    } as unknown as JwtService;

    authServicio = new AuthServicio(
      prisma,
      usuarioRepositorio,
      {} as NegocioRepositorio,
      jwtService,
    );
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
    vi.mocked(usuarioRepositorio.buscarPorCorreo).mockResolvedValue({
      id: 'usuario-existente',
      negocioId: 'negocio-1',
      nombre: 'Existente',
      correo: 'ana@ejemplo.com',
      hashContrasena: 'hash',
      rol: 'propietario',
      estado: 'activo',
      telefono: null,
      fechaCreacion: new Date(),
      ultimoAcceso: null,
      fechaActualizacion: new Date(),
    });

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
