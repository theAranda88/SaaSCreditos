-- Índice compuesto para consultas de cartera del día y mora (esquema §5.5)
CREATE INDEX IF NOT EXISTS "cuotas_negocio_id_fecha_vencimiento_estado_idx"
  ON "cuotas" ("negocio_id", "fecha_vencimiento", "estado");
