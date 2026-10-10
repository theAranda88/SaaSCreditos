-- CreateTable comprobantes_pago (V2-F)
CREATE TABLE "comprobantes_pago" (
    "id" UUID NOT NULL,
    "pago_id" UUID NOT NULL UNIQUE,
    "tipo_almacenamiento" VARCHAR(40) NOT NULL,
    "contenido" TEXT NOT NULL,
    "nombre_original" VARCHAR(240) NOT NULL,
    "mime_type" VARCHAR(60) NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprobantes_pago_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "comprobantes_pago_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pagos" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "comprobantes_pago_pago_id_idx" ON "comprobantes_pago"("pago_id");
