import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearAppPruebas } from './utilidades-app';

describe('Salud (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearAppPruebas();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('debe responder 200 en GET /api/salud', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/salud').expect(200);

    expect(respuesta.body).toEqual({
      estado: 'ok',
      servicio: 'api',
      version: '0.1.0',
    });
  });
});
