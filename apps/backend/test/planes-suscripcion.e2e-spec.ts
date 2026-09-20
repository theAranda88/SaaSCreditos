import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { borrarSuscripciones, crearAppPruebas } from './utilidades-app';

describe('Planes y suscripciones (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const correoNegocioA = `planes-a-${sufijo}@prueba.com`;
  const correoAdmin = `admin-${sufijo}@plataforma.local`;
  const contrasena = 'ClaveSegura123';
  let tokenNegocioA = '';
  let tokenAdmin = '';
  let negocioAId = '';
  let planEmprendedorId = '';
  let planProfesionalId = '';

  beforeAll(async () => {
    app = await crearAppPruebas();
    prisma = new PrismaClient();

    const registroA = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        nombreComercial: `Planes A ${sufijo}`,
        nombre: 'Propietario Planes',
        correo: correoNegocioA,
        contrasena,
      })
      .expect(201);

    tokenNegocioA = registroA.body.token;
    negocioAId = registroA.body.usuario.negocio_id;

    const emprendedor = await prisma.plan.findUnique({ where: { codigo: 'emprendedor' } });
    const profesional = await prisma.plan.findUnique({ where: { codigo: 'profesional' } });
    planEmprendedorId = emprendedor?.id ?? '';
    planProfesionalId = profesional?.id ?? '';

    await prisma.usuario.create({
      data: {
        nombre: 'Admin Plataforma Test',
        correo: correoAdmin,
        hashContrasena: await bcrypt.hash(contrasena, 12),
        rol: 'admin_plataforma',
      },
    });

    const loginAdmin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ correo: correoAdmin, contrasena })
      .expect(200);

    tokenAdmin = loginAdmin.body.token;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.auditoria.deleteMany({ where: { negocioId: negocioAId } });
      await prisma.usuario.deleteMany({
        where: {
          OR: [{ correo: correoAdmin }, { negocioId: negocioAId }],
        },
      });
      await borrarSuscripciones(prisma, [negocioAId]);
      await prisma.negocio.deleteMany({ where: { id: negocioAId } });
      await prisma.$disconnect();
    }

    if (app) {
      await app.close();
    }
  });

  it('debe consultar la suscripción propia con cupo del plan emprendedor', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/suscripciones/mia')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(respuesta.body).toMatchObject({
      negocio_id: negocioAId,
      estado: 'activa',
      cobradores_activos: 0,
      limite_cobradores: 3,
      plan: { codigo: 'emprendedor' },
    });
  });

  it('debe rechazar el cuarto cobrador del plan emprendedor con 422', async () => {
    for (let indice = 1; indice <= 3; indice += 1) {
      await request(app.getHttpServer())
        .post('/api/cobradores')
        .set('Authorization', `Bearer ${tokenNegocioA}`)
        .send({
          nombre: `Cobrador ${indice}`,
          correo: `cobrador-${indice}-${sufijo}@prueba.com`,
          contrasena,
        })
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/api/cobradores')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({
        nombre: 'Cobrador extra',
        correo: `cobrador-extra-${sufijo}@prueba.com`,
        contrasena,
      })
      .expect(422);
  });

  it('debe rechazar checkout a un plan menor cuando el cupo no cabe', async () => {
    await request(app.getHttpServer())
      .post('/api/suscripciones/checkout-stub')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ planId: planProfesionalId })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/cobradores')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({
        nombre: 'Cobrador cuatro',
        correo: `cobrador-4-${sufijo}@prueba.com`,
        contrasena,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/suscripciones/checkout-stub')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ planId: planEmprendedorId })
      .expect(422);
  });

  it('debe responder 403 en operaciones de negocio suspendido y 200 en la suscripción', async () => {
    await request(app.getHttpServer())
      .patch(`/api/plataforma/negocios/${negocioAId}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'suspendido' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({
        nombreCompleto: 'Cliente Bloqueado',
        tipoDocumento: 'CC',
        numeroDocumento: `SUSP-${sufijo}`,
        telefono: '3001234567',
      })
      .expect(403);

    const suscripcion = await request(app.getHttpServer())
      .get('/api/suscripciones/mia')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(suscripcion.body.estado).toBe('suspendida');

    const auditoria = await prisma.auditoria.findFirst({
      where: { negocioId: negocioAId, accion: 'suspender' },
    });
    expect(auditoria).not.toBeNull();
  });

  it('debe listar negocios en plataforma y rechazar clientes con admin_plataforma', async () => {
    const listado = await request(app.getHttpServer())
      .get('/api/plataforma/negocios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(listado.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: negocioAId })]),
    );

    await request(app.getHttpServer())
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(403);
  });
});
