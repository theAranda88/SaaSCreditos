-- CreateEnum
CREATE TYPE "estado_suscripcion" AS ENUM ('activa', 'pago_fallido', 'cancelada', 'suspendida');

-- CreateTable
CREATE TABLE "suscripciones" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "estado" "estado_suscripcion" NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_renovacion" DATE NOT NULL,
    "fecha_cancelacion" DATE,
    "referencia_pago_externo" VARCHAR(120),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_negocio_id_key" ON "suscripciones"("negocio_id");

-- CreateIndex
CREATE INDEX "suscripciones_plan_id_idx" ON "suscripciones"("plan_id");

-- CreateIndex
CREATE INDEX "suscripciones_estado_idx" ON "suscripciones"("estado");

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
