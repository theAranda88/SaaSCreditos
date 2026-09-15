import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const configSwagger = new DocumentBuilder()
    .setTitle('Creditos SaaS API')
    .setDescription('API multiempresa de gestión de créditos y cobro diario')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const documento = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup('api/docs', app, documento);

  const puerto = Number(process.env.API_PORT ?? 3000);
  await app.listen(puerto, '0.0.0.0');
}

void bootstrap();
