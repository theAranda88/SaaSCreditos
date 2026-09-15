import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';

describe('Salud (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
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
