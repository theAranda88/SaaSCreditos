#!/bin/sh
set -e

echo "[db-init] Aplicando migraciones Prisma..."
npm run db:migrate:deploy --workspace=@creditos/backend

echo "[db-init] Ejecutando semilla de datos..."
npm run db:seed --workspace=@creditos/backend

echo "[db-init] Base de datos lista."
