-- Migración V2-B: Agregar campo barrio (obligatorio) y hacer direccion NOT NULL

-- Primero: llenar direccion con placeholder si es NULL (datos existentes)
UPDATE "clientes" SET "direccion" = 'Sin especificar' WHERE "direccion" IS NULL;

-- Hacer direccion NOT NULL
ALTER TABLE "clientes" ALTER COLUMN "direccion" SET NOT NULL;

-- Agregar columna barrio (inicialmente nullable)
ALTER TABLE "clientes" ADD COLUMN "barrio" VARCHAR(120);

-- Llenar barrio con placeholder (datos existentes)
UPDATE "clientes" SET "barrio" = 'Sin especificar' WHERE "barrio" IS NULL;

-- Hacer barrio NOT NULL
ALTER TABLE "clientes" ALTER COLUMN "barrio" SET NOT NULL;

-- Crear índice opcional para búsquedas por barrio (V2 enriquecida)
CREATE INDEX "clientes_negocio_id_barrio_idx" ON "clientes"("negocio_id", "barrio");
