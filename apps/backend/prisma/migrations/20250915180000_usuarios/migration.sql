-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('propietario', 'administrador', 'cobrador', 'soporte', 'admin_plataforma');

-- CreateEnum
CREATE TYPE "estado_usuario" AS ENUM ('activo', 'inactivo');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "negocio_id" UUID,
    "nombre" VARCHAR(160) NOT NULL,
    "correo" VARCHAR(180) NOT NULL,
    "hash_contrasena" VARCHAR(255) NOT NULL,
    "rol" "rol_usuario" NOT NULL,
    "estado" "estado_usuario" NOT NULL DEFAULT 'activo',
    "telefono" VARCHAR(30),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_acceso" TIMESTAMPTZ(6),
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "usuarios_negocio_id_idx" ON "usuarios"("negocio_id");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "usuarios_estado_idx" ON "usuarios"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_un_propietario_activo_por_negocio" ON "usuarios"("negocio_id")
WHERE "rol" = 'propietario' AND "estado" = 'activo';

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_negocio_check" CHECK (
    (
        "rol" IN ('propietario', 'administrador', 'cobrador')
        AND "negocio_id" IS NOT NULL
    )
    OR (
        "rol" IN ('soporte', 'admin_plataforma')
        AND "negocio_id" IS NULL
    )
);
