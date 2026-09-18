-- CreateEnum
CREATE TYPE "estado_asignacion" AS ENUM ('activa', 'finalizada');

-- CreateTable
CREATE TABLE "asignaciones" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "credito_id" UUID NOT NULL,
    "cobrador_id" UUID NOT NULL,
    "fecha_asignacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMPTZ(6),
    "estado" "estado_asignacion" NOT NULL DEFAULT 'activa',
    "asignado_por" UUID NOT NULL,

    CONSTRAINT "asignaciones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "asignaciones_fecha_fin_coherente" CHECK (
      ("estado" = 'activa' AND "fecha_fin" IS NULL)
      OR ("estado" = 'finalizada' AND "fecha_fin" IS NOT NULL)
    )
);

-- CreateIndex
CREATE INDEX "asignaciones_negocio_id_idx" ON "asignaciones"("negocio_id");

-- CreateIndex
CREATE INDEX "asignaciones_credito_id_idx" ON "asignaciones"("credito_id");

-- CreateIndex
CREATE INDEX "asignaciones_cobrador_id_idx" ON "asignaciones"("cobrador_id");

-- CreateIndex
CREATE INDEX "asignaciones_estado_idx" ON "asignaciones"("estado");

-- CreateIndex
CREATE INDEX "asignaciones_negocio_id_cobrador_id_estado_idx" ON "asignaciones"("negocio_id", "cobrador_id", "estado");

-- Unique parcial: una sola asignación activa por crédito (RF-007)
CREATE UNIQUE INDEX "asignaciones_una_activa_por_credito" ON "asignaciones"("credito_id")
WHERE "estado" = 'activa';

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_credito_id_fkey" FOREIGN KEY ("credito_id") REFERENCES "creditos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_cobrador_id_fkey" FOREIGN KEY ("cobrador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_asignado_por_fkey" FOREIGN KEY ("asignado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Crédito, cobrador y quien asigna deben pertenecer al mismo negocio
CREATE OR REPLACE FUNCTION validar_asignacion_mismo_negocio()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM creditos
    WHERE id = NEW.credito_id AND negocio_id = NEW.negocio_id
  ) THEN
    RAISE EXCEPTION 'El crédito no pertenece al mismo negocio de la asignación';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = NEW.cobrador_id AND negocio_id = NEW.negocio_id AND rol = 'cobrador'
  ) THEN
    RAISE EXCEPTION 'El cobrador no pertenece al mismo negocio o no tiene rol cobrador';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = NEW.asignado_por AND negocio_id = NEW.negocio_id
  ) THEN
    RAISE EXCEPTION 'Quien asigna no pertenece al mismo negocio';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_asignaciones_mismo_negocio
BEFORE INSERT OR UPDATE ON asignaciones
FOR EACH ROW
EXECUTE FUNCTION validar_asignacion_mismo_negocio();
