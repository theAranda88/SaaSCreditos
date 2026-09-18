-- CreateEnum
CREATE TYPE "metodo_pago" AS ENUM ('efectivo', 'transferencia', 'nequi', 'daviplata', 'otro');

-- CreateEnum
CREATE TYPE "estado_pago" AS ENUM ('valido', 'anulado');

-- CreateTable
CREATE TABLE "pagos" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "cuota_id" UUID NOT NULL,
    "credito_id" UUID NOT NULL,
    "cobrador_id" UUID NOT NULL,
    "monto" DECIMAL(18,2) NOT NULL,
    "fecha_pago" TIMESTAMPTZ(6) NOT NULL,
    "metodo_pago" "metodo_pago" NOT NULL,
    "estado" "estado_pago" NOT NULL DEFAULT 'valido',
    "motivo_anulacion" VARCHAR(240),
    "anulado_por" UUID,
    "fecha_anulacion" TIMESTAMPTZ(6),
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pagos_monto_positivo" CHECK ("monto" > 0),
    CONSTRAINT "pagos_anulacion_coherente" CHECK (
        ("estado" = 'anulado' AND "motivo_anulacion" IS NOT NULL AND "anulado_por" IS NOT NULL AND "fecha_anulacion" IS NOT NULL)
        OR ("estado" = 'valido' AND "motivo_anulacion" IS NULL AND "anulado_por" IS NULL AND "fecha_anulacion" IS NULL)
    )
);

-- CreateIndex
CREATE INDEX "pagos_negocio_id_idx" ON "pagos"("negocio_id");

-- CreateIndex
CREATE INDEX "pagos_credito_id_idx" ON "pagos"("credito_id");

-- CreateIndex
CREATE INDEX "pagos_cuota_id_idx" ON "pagos"("cuota_id");

-- CreateIndex
CREATE INDEX "pagos_cobrador_id_idx" ON "pagos"("cobrador_id");

-- CreateIndex
CREATE INDEX "pagos_fecha_pago_idx" ON "pagos"("fecha_pago");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE INDEX "pagos_negocio_id_fecha_pago_estado_idx" ON "pagos"("negocio_id", "fecha_pago", "estado");

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_cuota_id_fkey" FOREIGN KEY ("cuota_id") REFERENCES "cuotas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_credito_id_fkey" FOREIGN KEY ("credito_id") REFERENCES "creditos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_cobrador_id_fkey" FOREIGN KEY ("cobrador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_anulado_por_fkey" FOREIGN KEY ("anulado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
