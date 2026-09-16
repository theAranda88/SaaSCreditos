import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearAppPruebas } from './utilidades-app';

describe('Cobradores (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const correoNegocioA = `cobradores-a-${sufijo}@prueba.com`;
  const correoNegocioB = `cobradores-b-${sufijo}@prueba.com`;
  const correoCobradorA = `cobrador-alta-${sufijo}@prueba.com`;
  const contrasena = 'ClaveSegura123';
  let tokenNegocioA = '';
  let tokenNegocioB = '';
  let tokenCobrador = '';
  let negocioAId = '';
  let negocioBId = '';
  let cobradorAId = '';

  const payloadCobrador = {
    nombre: 'Carlos Cobrador',
    correo: correoCobradorA,
    contrasena,
    telefono: '3001234567',
  };

  beforeAll(async () => {
    app = await crearAppPruebas();
    prisma = new PrismaClient();

    const registroA = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        nombreComercial: `Cobradores A ${sufijo}`,
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
        nombreComercial: `Cobradores B ${sufijo}`,
        nombre: 'Propietario B',
        correo: correoNegocioB,
        contrasena,
      })
      .expect(201);

    tokenNegocioB = registroB.body.token;
    negocioBId = registroB.body.usuario.negocio_id;
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
      await prisma.negocio.deleteMany({
        where: { id: { in: [negocioAId, negocioBId].filter(Boolean) } },
      });
      await prisma.$disconnect();
    }

    if (app) {
      await app.close();
    }
  });

  it('debe responder 401 al crear cobrador sin token', async () => {
    await request(app.getHttpServer()).post('/api/cobradores').send(payloadCobrador).expect(401);
  });

  it('debe crear y listar cobradores del propio negocio', async () => {
    const creado = await request(app.getHttpServer())
      .post('/api/cobradores')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send(payloadCobrador)
      .expect(201);

    cobradorAId = creado.body.id;
    expect(creado.body).toMatchObject({
      nombre: 'Carlos Cobrador',
      correo: correoCobradorA,
      rol: 'cobrador',
      negocio_id: negocioAId,
      estado: 'activo',
    });
    expect(creado.body).not.toHaveProperty('hash_contrasena');
    expect(creado.body).not.toHaveProperty('hashContrasena');
    expect(creado.body).not.toHaveProperty('contrasena');

    const persistido = await prisma.usuario.findUnique({ where: { id: cobradorAId } });
    expect(persistido?.hashContrasena).toMatch(/^\$2[aby]\$/);
    expect(persistido?.hashContrasena).not.toBe(contrasena);

    const listado = await request(app.getHttpServer())
      .get('/api/cobradores')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(listado.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: cobradorAId, rol: 'cobrador' })]),
    );
    expect(listado.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ rol: 'propietario' })]),
    );

    const loginCobrador = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoCobradorA, contrasena })
      .expect(200);

    tokenCobrador = loginCobrador.body.token;
  });

  it('debe rechazar correo duplicado con 409', async () => {
    await request(app.getHttpServer())
      .post('/api/cobradores')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send(payloadCobrador)
      .expect(409);
  });

  it('debe rechazar el mismo correo en otro negocio con 409', async () => {
    await request(app.getHttpServer())
      .post('/api/cobradores')
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .send(payloadCobrador)
      .expect(409);
  });

  it('debe rechazar creación de cobradores por rol cobrador con 403', async () => {
    await request(app.getHttpServer())
      .post('/api/cobradores')
      .set('Authorization', `Bearer ${tokenCobrador}`)
      .send({
        nombre: 'Otro Cobrador',
        correo: `otro-cobrador-${sufijo}@prueba.com`,
        contrasena,
      })
      .expect(403);
  });

  it('debe responder 404 al consultar un cobrador de otro negocio', async () => {
    await request(app.getHttpServer())
      .get(`/api/cobradores/${cobradorAId}`)
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .expect(404);
  });

  it('no debe listar cobradores de otro negocio', async () => {
    const listado = await request(app.getHttpServer())
      .get('/api/cobradores')
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .expect(200);

    expect(listado.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: cobradorAId })]),
    );
  });

  it('debe inactivar un cobrador y negar su login posterior', async () => {
    const inactivado = await request(app.getHttpServer())
      .patch(`/api/cobradores/${cobradorAId}/estado`)
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ estado: 'inactivo' })
      .expect(200);

    expect(inactivado.body.estado).toBe('inactivo');

    const persistido = await prisma.usuario.findUnique({ where: { id: cobradorAId } });
    expect(persistido?.estado).toBe('inactivo');
    expect(persistido?.correo).toBe(correoCobradorA);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoCobradorA, contrasena })
      .expect(401);
  });
});
