import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearAppPruebas } from './utilidades-app';

describe('Clientes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const sufijo = Date.now();
  const correoNegocioA = `clientes-a-${sufijo}@prueba.com`;
  const correoNegocioB = `clientes-b-${sufijo}@prueba.com`;
  const correoCobrador = `clientes-cobrador-${sufijo}@prueba.com`;
  const contrasena = 'ClaveSegura123';
  let tokenNegocioA = '';
  let tokenNegocioB = '';
  let tokenCobrador = '';
  let negocioAId = '';
  let negocioBId = '';
  let clienteAId = '';

  const payloadCliente = {
    nombreCompleto: 'María Pérez',
    tipoDocumento: 'CC',
    numeroDocumento: `CC-${sufijo}`,
    telefono: '3001234567',
    direccion: 'Calle 10 # 5-20',
    referenciaUbicacion: 'Frente al parque',
  };

  beforeAll(async () => {
    app = await crearAppPruebas();
    prisma = new PrismaClient();

    const registroA = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        nombreComercial: `Clientes A ${sufijo}`,
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
        nombreComercial: `Clientes B ${sufijo}`,
        nombre: 'Propietario B',
        correo: correoNegocioB,
        contrasena,
      })
      .expect(201);

    tokenNegocioB = registroB.body.token;
    negocioBId = registroB.body.usuario.negocio_id;

    await prisma.usuario.create({
      data: {
        negocioId: negocioAId,
        nombre: 'Cobrador A',
        correo: correoCobrador,
        hashContrasena: await bcrypt.hash(contrasena, 12),
        rol: 'cobrador',
      },
    });

    const loginCobrador = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoCobrador, contrasena })
      .expect(200);

    tokenCobrador = loginCobrador.body.token;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.cliente.deleteMany({
        where: { negocioId: { in: [negocioAId, negocioBId].filter(Boolean) } },
      });
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

  it('debe responder 401 al crear cliente sin token', async () => {
    await request(app.getHttpServer()).post('/api/clientes').send(payloadCliente).expect(401);
  });

  it('debe crear y listar clientes del propio negocio', async () => {
    const creado = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send(payloadCliente)
      .expect(201);

    clienteAId = creado.body.id;
    expect(creado.body).toMatchObject({
      nombre_completo: 'María Pérez',
      tipo_documento: 'CC',
      numero_documento: payloadCliente.numeroDocumento,
      negocio_id: negocioAId,
      estado: 'activo',
    });
    expect(creado.body).not.toHaveProperty('negocioId');

    const listado = await request(app.getHttpServer())
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(listado.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: clienteAId })]),
    );
  });

  it('debe rechazar documento duplicado en el mismo negocio con 409', async () => {
    await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send(payloadCliente)
      .expect(409);
  });

  it('debe permitir el mismo documento en otro negocio', async () => {
    const creado = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .send(payloadCliente)
      .expect(201);

    expect(creado.body.negocio_id).toBe(negocioBId);
    expect(creado.body.numero_documento).toBe(payloadCliente.numeroDocumento);
  });

  it('debe rechazar creación de clientes por rol cobrador con 403', async () => {
    await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenCobrador}`)
      .send({
        ...payloadCliente,
        numeroDocumento: `COB-${sufijo}`,
      })
      .expect(403);
  });

  it('debe responder 404 al consultar un cliente de otro negocio', async () => {
    await request(app.getHttpServer())
      .get(`/api/clientes/${clienteAId}`)
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .expect(404);
  });

  it('no debe listar clientes de otro negocio', async () => {
    const listado = await request(app.getHttpServer())
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .expect(200);

    expect(listado.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: clienteAId })]),
    );
  });

  it('debe inactivar un cliente sin borrarlo', async () => {
    const inactivado = await request(app.getHttpServer())
      .patch(`/api/clientes/${clienteAId}/estado`)
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ estado: 'inactivo' })
      .expect(200);

    expect(inactivado.body.estado).toBe('inactivo');

    const persistido = await prisma.cliente.findUnique({ where: { id: clienteAId } });
    expect(persistido?.estado).toBe('inactivo');
  });
});
