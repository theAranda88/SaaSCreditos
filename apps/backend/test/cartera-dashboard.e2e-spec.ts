import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearAppPruebas } from './utilidades-app';

describe('Cartera y dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const correoNegocioA = `cartera-a-${sufijo}@prueba.com`;
  const correoNegocioB = `cartera-b-${sufijo}@prueba.com`;
  const contrasena = 'ClaveSegura123';
  let tokenNegocioA = '';
  let tokenNegocioB = '';
  let negocioAId = '';
  let negocioBId = '';
  let clienteAId = '';
  let creditoAId = '';
  let cuotaAId = '';

  beforeAll(async () => {
    app = await crearAppPruebas();
    prisma = new PrismaClient();

    const registroA = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        nombreComercial: `Cartera A ${sufijo}`,
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
        nombreComercial: `Cartera B ${sufijo}`,
        nombre: 'Propietario B',
        correo: correoNegocioB,
        contrasena,
      })
      .expect(201);

    tokenNegocioB = registroB.body.token;
    negocioBId = registroB.body.usuario.negocio_id;

    const clienteA = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({
        nombreCompleto: 'Pedro Ríos',
        tipoDocumento: 'CC',
        numeroDocumento: `CT-${sufijo}`,
        telefono: '3001234567',
      })
      .expect(201);
    clienteAId = clienteA.body.id;

    const credito = await request(app.getHttpServer())
      .post('/api/creditos')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({
        clienteId: clienteAId,
        montoPrincipal: 100000,
        tasaInteres: 20,
        valorMora: 5000,
        periodicidad: 'diaria',
        numeroCuotas: 10,
        fechaDesembolso: '2026-09-10',
      })
      .expect(201);

    creditoAId = credito.body.credito.id;
    cuotaAId = credito.body.cuotas[0]?.id as string;

    await prisma.cuota.update({
      where: { id: cuotaAId },
      data: { fechaVencimiento: new Date('2026-09-15T00:00:00.000Z') },
    });

    await prisma.cuota.updateMany({
      where: { creditoId: creditoAId, id: { not: cuotaAId } },
      data: { fechaVencimiento: new Date('2026-12-31T00:00:00.000Z') },
    });
  });

  afterAll(async () => {
    if (prisma) {
      const negocios = [negocioAId, negocioBId].filter(Boolean);
      await prisma.pago.deleteMany({ where: { negocioId: { in: negocios } } });
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

  it('debe listar cartera vigente del negocio autenticado', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/cartera?segmento=vigente')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(respuesta.body.length).toBeGreaterThan(0);
    expect(respuesta.body[0]).toMatchObject({
      credito_id: creditoAId,
      cliente_nombre_completo: 'Pedro Ríos',
      estado_credito: 'activo',
    });
  });

  it('debe aplicar mora con recargo cuando el crédito tiene valor_mora', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/cartera/aplicar-mora')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(201);

    expect(respuesta.body.cuotas_actualizadas).toBeGreaterThan(0);

    const cuota = await prisma.cuota.findUnique({ where: { id: cuotaAId } });
    expect(cuota?.estado).toBe('mora');
    expect(cuota?.montoEsperado.toFixed(2)).toBe('17000.00');
    expect(cuota?.saldoPendiente.toFixed(2)).toBe('17000.00');

    const credito = await prisma.credito.findUnique({ where: { id: creditoAId } });
    expect(credito?.estado).toBe('mora');

    const auditoria = await prisma.auditoria.findFirst({
      where: { negocioId: negocioAId, accion: 'aplicar_mora' },
    });
    expect(auditoria).not.toBeNull();
  });

  it('debe listar cartera en mora tras aplicar mora', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/cartera?segmento=mora')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(respuesta.body.some((item: { credito_id: string }) => item.credito_id === creditoAId)).toBe(
      true,
    );
  });

  it('debe devolver KPIs del dashboard sin datos de otro negocio', async () => {
    const dashboardA = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    const dashboardB = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .expect(200);

    expect(Number(dashboardA.body.cartera_mora)).toBeGreaterThan(0);
    expect(dashboardA.body.creditos_en_mora).toBeGreaterThanOrEqual(1);
    expect(dashboardB.body.cartera_mora).toBe('0.00');
    expect(dashboardB.body.creditos_en_mora).toBe(0);
    expect(Number(dashboardA.body.cartera_mora)).toBeGreaterThan(
      Number(dashboardB.body.cartera_mora),
    );
  });
});
