import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearAppPruebas } from './utilidades-app';

describe('Asignaciones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const correoNegocioA = `asig-a-${sufijo}@prueba.com`;
  const correoNegocioB = `asig-b-${sufijo}@prueba.com`;
  const correoCobradorA = `asig-cobrador-a-${sufijo}@prueba.com`;
  const correoCobradorB = `asig-cobrador-b-${sufijo}@prueba.com`;
  const correoCobradorInactivo = `asig-cobrador-inact-${sufijo}@prueba.com`;
  const contrasena = 'ClaveSegura123';
  let tokenNegocioA = '';
  let tokenNegocioB = '';
  let tokenCobradorA = '';
  let tokenCobradorB = '';
  let negocioAId = '';
  let negocioBId = '';
  let clienteAId = '';
  let cobradorAId = '';
  let cobradorBId = '';
  let cobradorInactivoId = '';
  let creditoAId = '';
  let asignacionAId = '';

  const payloadCredito = {
    montoPrincipal: 100000,
    tasaInteres: 20,
    valorMora: 5000,
    periodicidad: 'diaria',
    numeroCuotas: 10,
    fechaDesembolso: '2026-09-16',
  };

  beforeAll(async () => {
    app = await crearAppPruebas();
    prisma = new PrismaClient();

    const registroA = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        nombreComercial: `Asignaciones A ${sufijo}`,
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
        nombreComercial: `Asignaciones B ${sufijo}`,
        nombre: 'Propietario B',
        correo: correoNegocioB,
        contrasena,
      })
      .expect(201);

    tokenNegocioB = registroB.body.token;
    negocioBId = registroB.body.usuario.negocio_id;

    const cobradorA = await prisma.usuario.create({
      data: {
        negocioId: negocioAId,
        nombre: 'Cobrador A',
        correo: correoCobradorA,
        hashContrasena: await bcrypt.hash(contrasena, 12),
        rol: 'cobrador',
      },
    });
    cobradorAId = cobradorA.id;

    const cobradorB = await prisma.usuario.create({
      data: {
        negocioId: negocioAId,
        nombre: 'Cobrador B',
        correo: correoCobradorB,
        hashContrasena: await bcrypt.hash(contrasena, 12),
        rol: 'cobrador',
      },
    });
    cobradorBId = cobradorB.id;

    const cobradorInactivo = await prisma.usuario.create({
      data: {
        negocioId: negocioAId,
        nombre: 'Cobrador Inactivo',
        correo: correoCobradorInactivo,
        hashContrasena: await bcrypt.hash(contrasena, 12),
        rol: 'cobrador',
        estado: 'inactivo',
      },
    });
    cobradorInactivoId = cobradorInactivo.id;

    const loginA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoCobradorA, contrasena })
      .expect(200);
    tokenCobradorA = loginA.body.token;

    const loginB = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoCobradorB, contrasena })
      .expect(200);
    tokenCobradorB = loginB.body.token;

    const clienteA = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({
        nombreCompleto: 'María Pérez',
        tipoDocumento: 'CC',
        numeroDocumento: `AS-${sufijo}`,
        telefono: '3001234567',
      })
      .expect(201);
    clienteAId = clienteA.body.id;

    const credito = await request(app.getHttpServer())
      .post('/api/creditos')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ ...payloadCredito, clienteId: clienteAId })
      .expect(201);
    creditoAId = credito.body.credito.id;
  });

  afterAll(async () => {
    if (prisma) {
      const negocios = [negocioAId, negocioBId].filter(Boolean);
      await prisma.asignacion.deleteMany({ where: { negocioId: { in: negocios } } });
      await prisma.cuota.deleteMany({ where: { negocioId: { in: negocios } } });
      await prisma.auditoria.deleteMany({ where: { negocioId: { in: negocios } } });
      await prisma.credito.deleteMany({ where: { negocioId: { in: negocios } } });
      await prisma.cliente.deleteMany({ where: { negocioId: { in: negocios } } });
      await prisma.usuario.deleteMany({
        where: {
          OR: [
            { correo: { contains: `${sufijo}@prueba.com` } },
            { negocioId: { in: negocios } },
          ],
        },
      });
      await prisma.negocio.deleteMany({ where: { id: { in: negocios } } });
      await prisma.$disconnect();
    }

    if (app) {
      await app.close();
    }
  });

  it('debe responder 401 al asignar sin token', async () => {
    await request(app.getHttpServer())
      .post('/api/asignaciones')
      .send({ creditoId: creditoAId, cobradorId: cobradorAId })
      .expect(401);
  });

  it('debe asignar un crédito activo a un cobrador y auditar', async () => {
    const creada = await request(app.getHttpServer())
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ creditoId: creditoAId, cobradorId: cobradorAId })
      .expect(201);

    asignacionAId = creada.body.id;
    expect(creada.body).toMatchObject({
      negocio_id: negocioAId,
      credito_id: creditoAId,
      cobrador_id: cobradorAId,
      estado: 'activa',
      fecha_fin: null,
      asignado_por: expect.any(String),
      credito: {
        id: creditoAId,
        cliente_id: clienteAId,
        cliente_nombre_completo: 'María Pérez',
        estado: 'activo',
      },
    });

    const auditoria = await prisma.auditoria.findFirst({
      where: { entidad: 'asignaciones', entidadId: asignacionAId, accion: 'crear' },
    });
    expect(auditoria).not.toBeNull();
    expect(auditoria?.negocioId).toBe(negocioAId);
  });

  it('no debe permitir dos asignaciones activas simultáneas en BD', async () => {
    await expect(
      prisma.asignacion.create({
        data: {
          negocioId: negocioAId,
          creditoId: creditoAId,
          cobradorId: cobradorBId,
          asignadoPor: cobradorAId,
          estado: 'activa',
        },
      }),
    ).rejects.toThrow();

    const activas = await prisma.asignacion.count({
      where: { creditoId: creditoAId, estado: 'activa' },
    });
    expect(activas).toBe(1);
  });

  it('debe reasignar en una transacción y dejar una sola activa', async () => {
    const reasignada = await request(app.getHttpServer())
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ creditoId: creditoAId, cobradorId: cobradorBId })
      .expect(201);

    expect(reasignada.body.cobrador_id).toBe(cobradorBId);
    expect(reasignada.body.estado).toBe('activa');

    const previa = await prisma.asignacion.findUnique({ where: { id: asignacionAId } });
    expect(previa?.estado).toBe('finalizada');
    expect(previa?.fechaFin).not.toBeNull();

    const activas = await prisma.asignacion.findMany({
      where: { creditoId: creditoAId, estado: 'activa' },
    });
    expect(activas).toHaveLength(1);
    expect(activas[0]?.id).toBe(reasignada.body.id);

    const auditoria = await prisma.auditoria.findFirst({
      where: { entidad: 'asignaciones', entidadId: reasignada.body.id, accion: 'reasignar' },
    });
    expect(auditoria).not.toBeNull();
    expect(auditoria?.detalle).toMatchObject({
      cobrador_anterior_id: cobradorAId,
      asignacion_anterior_id: asignacionAId,
    });
  });

  it('debe dejar la asignación previa activa si falla la reasignación', async () => {
    const uuidInexistente = '00000000-0000-4000-8000-000000000099';
    await request(app.getHttpServer())
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ creditoId: creditoAId, cobradorId: uuidInexistente })
      .expect(404);

    const activas = await prisma.asignacion.findMany({
      where: { creditoId: creditoAId, estado: 'activa' },
    });
    expect(activas).toHaveLength(1);
    expect(activas[0]?.cobradorId).toBe(cobradorBId);
  });

  it('debe rechazar cobrador inactivo con 422', async () => {
    await request(app.getHttpServer())
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ creditoId: creditoAId, cobradorId: cobradorInactivoId })
      .expect(422);
  });

  it('debe rechazar asignación por rol cobrador con 403', async () => {
    await request(app.getHttpServer())
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenCobradorA}`)
      .send({ creditoId: creditoAId, cobradorId: cobradorAId })
      .expect(403);
  });

  it('debe responder 404 al asignar un crédito de otro negocio', async () => {
    await request(app.getHttpServer())
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .send({ creditoId: creditoAId, cobradorId: cobradorAId })
      .expect(404);
  });

  it('debe listar al cobrador solo su cartera activa', async () => {
    const listadoB = await request(app.getHttpServer())
      .get('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenCobradorB}`)
      .expect(200);

    expect(listadoB.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ credito_id: creditoAId, cobrador_id: cobradorBId, estado: 'activa' }),
      ]),
    );

    const listadoA = await request(app.getHttpServer())
      .get('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenCobradorA}`)
      .expect(200);

    expect(listadoA.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ credito_id: creditoAId, estado: 'activa' })]),
    );
  });

  it('debe responder 403 si un cobrador consulta la asignación de otro', async () => {
    const listadoAdmin = await request(app.getHttpServer())
      .get(`/api/asignaciones?cobradorId=${cobradorBId}&estado=activa`)
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    const asignacionBId = listadoAdmin.body[0]?.id as string;
    expect(asignacionBId).toBeDefined();

    await request(app.getHttpServer())
      .get(`/api/asignaciones/${asignacionBId}`)
      .set('Authorization', `Bearer ${tokenCobradorA}`)
      .expect(403);
  });

  it('no debe listar asignaciones de otro negocio', async () => {
    const listado = await request(app.getHttpServer())
      .get('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .expect(200);

    expect(listado.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ credito_id: creditoAId })]),
    );
  });
});
