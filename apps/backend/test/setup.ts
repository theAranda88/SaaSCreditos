import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env') });

if (!process.env.DATABASE_URL) {
  const usuario = process.env.POSTGRES_USER ?? 'creditos';
  const contrasena = process.env.POSTGRES_PASSWORD ?? 'creditos_dev';
  const baseDatos = process.env.POSTGRES_DB ?? 'creditos';
  const puerto = process.env.POSTGRES_PORT ?? '5433';
  const host = process.env.POSTGRES_HOST ?? 'localhost';

  process.env.DATABASE_URL = `postgresql://${usuario}:${encodeURIComponent(contrasena)}@${host}:${puerto}/${baseDatos}?schema=public`;
}

process.env.JWT_SECRETO = process.env.JWT_SECRETO ?? 'secreto-tests-dev';
