import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';

export async function crearAppPruebas(): Promise<INestApplication> {
  const modulo: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = modulo.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();

  return app;
}

export async function borrarSuscripciones(prisma: PrismaClient, negocioIds: string[]): Promise<void> {
  const ids = negocioIds.filter(Boolean);
  if (ids.length === 0) {
    return;
  }

  await prisma.suscripcion.deleteMany({ where: { negocioId: { in: ids } } });
}
