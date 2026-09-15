-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "estado_negocio" AS ENUM ('activo', 'suspendido', 'cancelado');

-- CreateEnum
CREATE TYPE "estado_plan" AS ENUM ('activo', 'inactivo');

-- CreateTable
CREATE TABLE "negocios" (
    "id" UUID NOT NULL,
    "nombre_comercial" VARCHAR(180) NOT NULL,
    "razon_social" VARCHAR(180),
    "documento_fiscal" VARCHAR(40),
    "moneda" CHAR(3) NOT NULL DEFAULT 'COP',
    "estado" "estado_negocio" NOT NULL DEFAULT 'activo',
    "configuracion" JSONB NOT NULL DEFAULT '{}',
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "negocios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "limite_cobradores" INTEGER NOT NULL,
    "precio_implementacion" DECIMAL(18,2) NOT NULL,
    "precio_mensual" DECIMAL(18,2) NOT NULL,
    "caracteristicas" JSONB NOT NULL DEFAULT '{}',
    "estado" "estado_plan" NOT NULL DEFAULT 'activo',
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "negocios_estado_idx" ON "negocios"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "planes_codigo_key" ON "planes"("codigo");
