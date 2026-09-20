import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearAppPruebas, borrarSuscripciones } from './utilidades-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const correoNegocioA = `negocio-a-${sufijo}@prueba.com`;
  const correoNegocioB = `negocio-b-${sufijo}@prueba.com`;
  const contrasena = 'ClaveSegura123';
  let tokenNegocioA = '';
  let negocioAId = '';
  let negocioBId = '';
  let usuarioCobradorId = '';

  beforeAll(async () => {
    app = await crearAppPruebas();
    prisma = new PrismaClient();

    const registroA = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        nombreComercial: `Negocio A ${sufijo}`,
        nombre: 'Propietario A',
        correo: correoNegocioA,
        contrasena,
      })
      .expect(201);

    tokenNegocioA = registroA.body.token;
    negocioAId = registroA.body.usuario.negocio_id;

    const registroB = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        nombreComercial: `Negocio B ${sufijo}`,
        nombre: 'Propietario B',
        correo: correoNegocioB,
        contrasena,
      })
      .expect(201);

    negocioBId = registroB.body.usuario.negocio_id;

    const cobrador = await prisma.usuario.create({
      data: {
        negocioId: negocioAId,
        nombre: 'Cobrador A',
        correo: `cobrador-a-${sufijo}@prueba.com`,
        hashContrasena: await bcrypt.hash(contrasena, 12),
        rol: 'cobrador',
      },
    });
    usuarioCobradorId = cobrador.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.usuario.deleteMany({
        where: {
          OR: [
            { correo: { contains: `${sufijo}@prueba.com` } },
            { negocioId: { in: [negocioAId, negocioBId].filter(Boolean) } },
          ],
        },
      });
      await borrarSuscripciones(prisma, [negocioAId, negocioBId]);
      await prisma.negocio.deleteMany({
        where: { id: { in: [negocioAId, negocioBId].filter(Boolean) } },
      });
      await prisma.$disconnect();
    }

    if (app) {
      await app.close();
    }
  });

  it('debe responder 401 en GET /api/auth/perfil sin token', async () => {
    await request(app.getHttpServer()).get('/api/auth/perfil').expect(401);
  });

  it('debe rechazar login con contraseña incorrecta', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoNegocioA, contrasena: 'ClaveIncorrecta1' })
      .expect(401);
  });

  it('debe iniciar sesión y devolver perfil con claims correctos', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoNegocioA, contrasena })
      .expect(200);

    expect(login.body.token).toBeTypeOf('string');
    expect(login.body.usuario).toMatchObject({
      correo: correoNegocioA,
      rol: 'propietario',
      negocio_id: negocioAId,
    });
    expect(login.body.usuario).not.toHaveProperty('contrasena');
    expect(login.body.usuario).not.toHaveProperty('hash_contrasena');

    const perfil = await request(app.getHttpServer())
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(perfil.body.negocio_id).toBe(negocioAId);
  });

  it('debe almacenar hash bcrypt y no exponer contraseña en registro', async () => {
    const usuario = await prisma.usuario.findUnique({
      where: { correo: correoNegocioA },
    });

    expect(usuario?.hashContrasena).toMatch(/^\$2[aby]\$/);
    expect(usuario?.hashContrasena).not.toBe(contrasena);
  });

  it('debe crear suscripción activa al plan emprendedor en el registro', async () => {
    const suscripcion = await prisma.suscripcion.findUnique({
      where: { negocioId: negocioAId },
      include: { plan: true },
    });

    expect(suscripcion?.estado).toBe('activa');
    expect(suscripcion?.plan.codigo).toBe('emprendedor');
  });

  it('debe rechazar consulta de negocio ajeno con 403', async () => {
    await request(app.getHttpServer())
      .get(`/api/negocios/${negocioBId}`)
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(403);
  });

  it('debe rechazar actualización de negocio por rol cobrador con 403', async () => {
    const loginCobrador = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: `cobrador-a-${sufijo}@prueba.com`, contrasena })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/negocios/mi-negocio')
      .set('Authorization', `Bearer ${loginCobrador.body.token}`)
      .send({ nombreComercial: 'Intento no autorizado' })
      .expect(403);

    expect(usuarioCobradorId).toBeTypeOf('string');
  });

  it('debe permitir al propietario consultar su negocio', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/negocios/mi-negocio')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(respuesta.body.id).toBe(negocioAId);
    expect(respuesta.body.nombre_comercial).toContain('Negocio A');
  });
});
