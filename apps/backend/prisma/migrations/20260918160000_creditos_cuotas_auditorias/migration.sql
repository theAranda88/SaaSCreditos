-- CreateEnum
CREATE TYPE "periodicidad_credito" AS ENUM ('diaria', 'semanal', 'quincenal', 'mensual');

-- CreateEnum
CREATE TYPE "estado_credito" AS ENUM ('activo', 'pagado', 'mora', 'anulado', 'refinanciado');

-- CreateEnum
CREATE TYPE "estado_cuota" AS ENUM ('pendiente', 'pagada', 'parcial', 'mora', 'anulada');

-- CreateTable
CREATE TABLE "creditos" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "monto_principal" DECIMAL(18,2) NOT NULL,
    "tasa_interes" DECIMAL(8,4) NOT NULL,
    "valor_mora" DECIMAL(18,2),
    "periodicidad" "periodicidad_credito" NOT NULL,
    "numero_cuotas" INTEGER NOT NULL,
    "fecha_desembolso" DATE NOT NULL,
    "estado" "estado_credito" NOT NULL DEFAULT 'activo',
    "condiciones_originales" JSONB NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(6) NOT NULL,
    "creado_por" UUID NOT NULL,

    CONSTRAINT "creditos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "creditos_monto_principal_positivo" CHECK ("monto_principal" > 0),
    CONSTRAINT "creditos_tasa_interes_no_negativa" CHECK ("tasa_interes" >= 0),
    CONSTRAINT "creditos_valor_mora_positivo" CHECK ("valor_mora" IS NULL OR "valor_mora" > 0),
    CONSTRAINT "creditos_numero_cuotas_minimo" CHECK ("numero_cuotas" >= 1)
);

-- CreateTable
CREATE TABLE "cuotas" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "credito_id" UUID NOT NULL,
    "numero_cuota" INTEGER NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "monto_esperado" DECIMAL(18,2) NOT NULL,
    "saldo_pendiente" DECIMAL(18,2) NOT NULL,
    "estado" "estado_cuota" NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "cuotas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cuotas_numero_cuota_minimo" CHECK ("numero_cuota" >= 1),
    CONSTRAINT "cuotas_monto_esperado_no_negativo" CHECK ("monto_esperado" >= 0),
    CONSTRAINT "cuotas_saldo_pendiente_rango" CHECK ("saldo_pendiente" >= 0 AND "saldo_pendiente" <= "monto_esperado")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" UUID NOT NULL,
    "negocio_id" UUID,
    "usuario_id" UUID NOT NULL,
    "entidad" VARCHAR(60) NOT NULL,
    "entidad_id" UUID NOT NULL,
    "accion" VARCHAR(40) NOT NULL,
    "detalle" JSONB NOT NULL DEFAULT '{}',
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_origen" VARCHAR(45),

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "creditos_negocio_id_idx" ON "creditos"("negocio_id");

-- CreateIndex
CREATE INDEX "creditos_cliente_id_idx" ON "creditos"("cliente_id");

-- CreateIndex
CREATE INDEX "creditos_estado_idx" ON "creditos"("estado");

-- CreateIndex
CREATE INDEX "creditos_fecha_desembolso_idx" ON "creditos"("fecha_desembolso");

-- CreateIndex
CREATE UNIQUE INDEX "cuotas_credito_id_numero_cuota_key" ON "cuotas"("credito_id", "numero_cuota");

-- CreateIndex
CREATE INDEX "cuotas_negocio_id_idx" ON "cuotas"("negocio_id");

-- CreateIndex
CREATE INDEX "cuotas_credito_id_idx" ON "cuotas"("credito_id");

-- CreateIndex
CREATE INDEX "cuotas_fecha_vencimiento_idx" ON "cuotas"("fecha_vencimiento");

-- CreateIndex
CREATE INDEX "cuotas_estado_idx" ON "cuotas"("estado");

-- CreateIndex
CREATE INDEX "auditorias_negocio_id_idx" ON "auditorias"("negocio_id");

-- CreateIndex
CREATE INDEX "auditorias_usuario_id_idx" ON "auditorias"("usuario_id");

-- CreateIndex
CREATE INDEX "auditorias_entidad_entidad_id_idx" ON "auditorias"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "auditorias_fecha_idx" ON "auditorias"("fecha");

-- AddForeignKey
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_credito_id_fkey" FOREIGN KEY ("credito_id") REFERENCES "creditos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- El cliente del crédito debe pertenecer al mismo negocio
CREATE OR REPLACE FUNCTION validar_credito_cliente_mismo_negocio()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM clientes
    WHERE id = NEW.cliente_id AND negocio_id = NEW.negocio_id
  ) THEN
    RAISE EXCEPTION 'El cliente no pertenece al mismo negocio del crédito';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_creditos_cliente_mismo_negocio
BEFORE INSERT OR UPDATE ON creditos
FOR EACH ROW
EXECUTE FUNCTION validar_credito_cliente_mismo_negocio();

-- condiciones_originales inmutable post-insert (RF-005)
CREATE OR REPLACE FUNCTION impedir_update_condiciones_originales()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.condiciones_originales IS DISTINCT FROM OLD.condiciones_originales THEN
    RAISE EXCEPTION 'condiciones_originales es inmutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_creditos_condiciones_inmutables
BEFORE UPDATE ON creditos
FOR EACH ROW
EXECUTE FUNCTION impedir_update_condiciones_originales();

-- auditorias: no se actualizan (append-only). El DELETE queda para limpieza operativa/tests.
CREATE OR REPLACE FUNCTION impedir_update_auditorias()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Las auditorías son append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditorias_append_only
BEFORE UPDATE ON auditorias
FOR EACH ROW
EXECUTE FUNCTION impedir_update_auditorias();
