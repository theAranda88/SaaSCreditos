-- CreateEnum
CREATE TYPE "estado_cliente" AS ENUM ('activo', 'inactivo');

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "nombre_completo" VARCHAR(180) NOT NULL,
    "tipo_documento" VARCHAR(20) NOT NULL,
    "numero_documento" VARCHAR(40) NOT NULL,
    "telefono" VARCHAR(30) NOT NULL,
    "direccion" VARCHAR(220),
    "referencia_ubicacion" VARCHAR(220),
    "estado" "estado_cliente" NOT NULL DEFAULT 'activo',
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,
    "creado_por" UUID NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_negocio_id_tipo_documento_numero_documento_key" ON "clientes"("negocio_id", "tipo_documento", "numero_documento");

-- CreateIndex
CREATE INDEX "clientes_negocio_id_idx" ON "clientes"("negocio_id");

-- CreateIndex
CREATE INDEX "clientes_negocio_id_nombre_completo_idx" ON "clientes"("negocio_id", "nombre_completo");

-- CreateIndex
CREATE INDEX "clientes_negocio_id_telefono_idx" ON "clientes"("negocio_id", "telefono");

-- CreateIndex
CREATE INDEX "clientes_creado_por_idx" ON "clientes"("creado_por");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
