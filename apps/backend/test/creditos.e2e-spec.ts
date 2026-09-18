import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearAppPruebas } from './utilidades-app';

describe('Creditos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  const sufijo = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const correoNegocioA = `creditos-a-${sufijo}@prueba.com`;
  const correoNegocioB = `creditos-b-${sufijo}@prueba.com`;
  const correoCobrador = `creditos-cobrador-${sufijo}@prueba.com`;
  const contrasena = 'ClaveSegura123';
  let tokenNegocioA = '';
  let tokenNegocioB = '';
  let tokenCobrador = '';
  let negocioAId = '';
  let negocioBId = '';
  let clienteAId = '';
  let clienteInactivoId = '';
  let creditoAId = '';

  const payloadCredito = {
    montoPrincipal: 100000,
    tasaInteres: 20,
    valorMora: 5000,
    periodicidad: 'diaria',
    numeroCuotas: 20,
    fechaDesembolso: '2026-09-16',
  };

  beforeAll(async () => {
    app = await crearAppPruebas();
    prisma = new PrismaClient();

    const registroA = await request(app.getHttpServer())
      .post('/api/auth/registro')
      .send({
        nombreComercial: `Creditos A ${sufijo}`,
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
        nombreComercial: `Creditos B ${sufijo}`,
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

    const clienteA = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({
        nombreCompleto: 'María Pérez',
        tipoDocumento: 'CC',
        numeroDocumento: `CC-${sufijo}`,
        telefono: '3001234567',
      })
      .expect(201);

    clienteAId = clienteA.body.id;

    const clienteInactivo = await request(app.getHttpServer())
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({
        nombreCompleto: 'Cliente Inactivo',
        tipoDocumento: 'CC',
        numeroDocumento: `IN-${sufijo}`,
        telefono: '3000000000',
      })
      .expect(201);

    clienteInactivoId = clienteInactivo.body.id;

    await request(app.getHttpServer())
      .patch(`/api/clientes/${clienteInactivoId}/estado`)
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ estado: 'inactivo' })
      .expect(200);
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

  it('debe responder 401 al crear crédito sin token', async () => {
    await request(app.getHttpServer())
      .post('/api/creditos')
      .send({ ...payloadCredito, clienteId: clienteAId })
      .expect(401);
  });

  it('debe crear un crédito con 20 cuotas cuya suma coincide con el total a pagar', async () => {
    const creado = await request(app.getHttpServer())
      .post('/api/creditos')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ ...payloadCredito, clienteId: clienteAId })
      .expect(201);

    creditoAId = creado.body.credito.id;
    expect(creado.body.credito).toMatchObject({
      negocio_id: negocioAId,
      cliente_id: clienteAId,
      monto_principal: '100000.00',
      tasa_interes: '20.0000',
      valor_mora: '5000.00',
      periodicidad: 'diaria',
      numero_cuotas: 20,
      fecha_desembolso: '2026-09-16',
      estado: 'activo',
    });
    expect(creado.body.cuotas).toHaveLength(20);
    expect(creado.body.credito.condiciones_originales).toMatchObject({
      total_a_pagar: '120000.00',
      monto_cuota_base: '6000.00',
      formula_interes: 'flat_sobre_principal',
    });

    const suma = creado.body.cuotas.reduce(
      (acumulado: number, cuota: { monto_esperado: string }) =>
        acumulado + Number(cuota.monto_esperado),
      0,
    );
    expect(suma).toBe(120000);
    expect(creado.body.cuotas[0]).toMatchObject({
      numero_cuota: 1,
      fecha_vencimiento: '2026-09-17',
      monto_esperado: '6000.00',
      saldo_pendiente: '6000.00',
      estado: 'pendiente',
    });

    const auditoria = await prisma.auditoria.findFirst({
      where: { entidad: 'creditos', entidadId: creditoAId, accion: 'crear' },
    });
    expect(auditoria).not.toBeNull();
    expect(auditoria?.negocioId).toBe(negocioAId);
  });

  it('debe consultar el plan de cuotas del crédito creado', async () => {
    const cuotas = await request(app.getHttpServer())
      .get(`/api/creditos/${creditoAId}/cuotas`)
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(cuotas.body).toHaveLength(20);
    expect(cuotas.body[19]).toMatchObject({ numero_cuota: 20, monto_esperado: '6000.00' });
  });

  it('no debe reescribir condiciones_originales si cambia la configuración del negocio', async () => {
    await request(app.getHttpServer())
      .patch('/api/negocios/mi-negocio')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ configuracion: { zona_horaria: 'America/Bogota' } })
      .expect(200);

    const detalle = await request(app.getHttpServer())
      .get(`/api/creditos/${creditoAId}`)
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .expect(200);

    expect(detalle.body.condiciones_originales).toMatchObject({
      monto_principal: '100000.00',
      tasa_interes: '20.0000',
      total_a_pagar: '120000.00',
    });

    await expect(
      prisma.credito.update({
        where: { id: creditoAId },
        data: { condicionesOriginales: { alterado: true } },
      }),
    ).rejects.toThrow(/condiciones_originales es inmutable/);
  });

  it('debe rechazar crédito de cliente inactivo con 422', async () => {
    await request(app.getHttpServer())
      .post('/api/creditos')
      .set('Authorization', `Bearer ${tokenNegocioA}`)
      .send({ ...payloadCredito, clienteId: clienteInactivoId })
      .expect(422);
  });

  it('debe rechazar creación de créditos por rol cobrador con 403', async () => {
    await request(app.getHttpServer())
      .post('/api/creditos')
      .set('Authorization', `Bearer ${tokenCobrador}`)
      .send({ ...payloadCredito, clienteId: clienteAId })
      .expect(403);
  });

  it('debe responder 404 al consultar un crédito de otro negocio', async () => {
    await request(app.getHttpServer())
      .get(`/api/creditos/${creditoAId}`)
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .expect(404);
  });

  it('no debe listar créditos de otro negocio', async () => {
    const listado = await request(app.getHttpServer())
      .get('/api/creditos')
      .set('Authorization', `Bearer ${tokenNegocioB}`)
      .expect(200);

    expect(listado.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: creditoAId })]),
    );
  });
});
