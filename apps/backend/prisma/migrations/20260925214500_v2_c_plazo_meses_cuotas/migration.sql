-- AddColumn plazo_meses a creditos (V2-C)
ALTER TABLE "creditos" ADD COLUMN "plazo_meses" INTEGER;

-- Actualizar creditos existentes con plazo_meses = numero_cuotas (migración de datos sin cambio de lógica)
-- Esto es conservador: asumimos 1 mes = numero_cuotas cuotas (aproximación)
UPDATE "creditos" SET "plazo_meses" = CASE
  WHEN "periodicidad" = 'mensual' THEN "numero_cuotas"
  WHEN "periodicidad" = 'quincenal' THEN "numero_cuotas" / 2
  WHEN "periodicidad" = 'semanal' THEN ROUND("numero_cuotas" * 12.0 / 52.0)
  ELSE ROUND("numero_cuotas" * 12.0 / 20.0) -- aproximación para diaria (20 días hábiles por mes)
END;

-- Set NOT NULL constraint
ALTER TABLE "creditos" ALTER COLUMN "plazo_meses" SET NOT NULL;

-- Add check constraint
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_plazo_meses_minimo" CHECK ("plazo_meses" >= 1);
