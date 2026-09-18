import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearAppPruebas } from './utilidades-app';

describe('Pagos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const correoNegocioA = `pagos-a-${sufijo}@prueba.com`;
  const correoNegocioB = `pagos-b-${sufijo}@prueba.com`;
  const correoCobradorA = `pagos-cobrador-a-${sufijo}@prueba.com`;
  const correoCobradorB = `pagos-cobrador-b-${sufijo}@prueba.com`;
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
  let creditoAId = '';
  let cuotaAId = '';
  let pagoId = '';

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
        nombreComercial: `Pagos A ${sufijo}`,
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
        nombreComercial: `Pagos B ${sufijo}`,
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
        nombreCompleto: 'Luis Gómez',
        tipoDocumento: 'CC',
        numeroDocumento: `PG-${sufijo}`,
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
    cuotaAId = credito.body.cuotas[0]?.id as string;

    await request(app.getHttpServer())
      .post('/api/asignaciones')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ creditoId: creditoAId, cobradorId: cobradorAId })
      .expect(201);
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

  it('debe responder dia_habil=false en domingo', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/pagos/cobros-del-dia?fecha=2026-09-20')
      .set('Authorization', `Bearer ${tokenCobradorA}`)
      .expect(200);

    expect(respuesta.body.dia_habil).toBe(false);
    expect(respuesta.body.cobros).toEqual([]);
  });

  it('debe listar cobros del día en fecha hábil', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/pagos/cobros-del-dia?fecha=2026-09-21')
      .set('Authorization', `Bearer ${tokenCobradorA}`)
      .expect(200);

    expect(respuesta.body.dia_habil).toBe(true);
    expect(respuesta.body.cobros.length).toBeGreaterThan(0);
    expect(respuesta.body.cobros[0]).toMatchObject({
      credito_id: creditoAId,
      cliente_nombre_completo: 'Luis Gómez',
    });
  });

  it('debe registrar un pago y actualizar saldo en transacción', async () => {
    const pago = await request(app.getHttpServer())
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenCobradorA}`)
      .send({
        cuotaId: cuotaAId,
        monto: 6000,
        metodoPago: 'efectivo',
        fechaPago: '2026-09-21T15:00:00.000Z',
      })
      .expect(201);

    pagoId = pago.body.id;
    expect(pago.body).toMatchObject({
      estado: 'valido',
      monto: '6000.00',
      credito_id: creditoAId,
      cuota_id: cuotaAId,
    });

    const cuota = await prisma.cuota.findUnique({ where: { id: cuotaAId } });
    expect(cuota?.saldoPendiente.toFixed(2)).toBe('6000.00');
    expect(cuota?.estado).toBe('parcial');

    const auditoria = await prisma.auditoria.findFirst({
      where: { entidad: 'pagos', entidadId: pagoId, accion: 'crear' },
    });
    expect(auditoria).not.toBeNull();
  });

  it('debe rechazar pago en domingo con 422', async () => {
    await request(app.getHttpServer())
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenCobradorA}`)
      .send({
        cuotaId: cuotaAId,
        monto: 1000,
        metodoPago: 'efectivo',
        fechaPago: '2026-09-20T15:00:00.000Z',
      })
      .expect(422);
  });

  it('debe rechazar cobro de cartera no asignada con 403', async () => {
    await request(app.getHttpServer())
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenCobradorB}`)
      .send({
        cuotaId: cuotaAId,
        monto: 1000,
        metodoPago: 'efectivo',
        fechaPago: '2026-09-21T16:00:00.000Z',
      })
      .expect(403);
  });

  it('debe listar historial de pagos por crédito', async () => {
    const historial = await request(app.getHttpServer())
      .get(`/api/pagos?creditoId=${creditoAId}`)
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(historial.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: pagoId, estado: 'valido' })]),
    );
  });

  it('debe anular un pago y revertir el saldo', async () => {
    const anulado = await request(app.getHttpServer())
      .post(`/api/pagos/${pagoId}/anular`)
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ motivoAnulacion: 'Registro duplicado por error' })
      .expect(200);

    expect(anulado.body.estado).toBe('anulado');

    const cuota = await prisma.cuota.findUnique({ where: { id: cuotaAId } });
    expect(cuota?.saldoPendiente.toFixed(2)).toBe('12000.00');
    expect(cuota?.estado).toBe('pendiente');

    const auditoria = await prisma.auditoria.findFirst({
      where: { entidad: 'pagos', entidadId: pagoId, accion: 'anular' },
    });
    expect(auditoria).not.toBeNull();
  });

  it('debe impedir que el cobrador anule pagos', async () => {
    const pago = await request(app.getHttpServer())
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenCobradorA}`)
      .send({
        cuotaId: cuotaAId,
        monto: 1000,
        metodoPago: 'efectivo',
        fechaPago: '2026-09-21T17:00:00.000Z',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/pagos/${pago.body.id}/anular`)
      .set('Authorization', `Bearer ${tokenCobradorA}`)
      .send({ motivoAnulacion: 'Intento de cobrador' })
      .expect(403);
  });

  it('no debe listar pagos de crédito de otro negocio', async () => {
    await request(app.getHttpServer())
      .get(`/api/pagos?creditoId=${creditoAId}`)
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .expect(404);
  });
});
