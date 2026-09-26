-- Proponer planta: ubicación de observación (GPS/mapa) y motivo/detalle del Parte+Uso propuesto.
ALTER TABLE "Planta" ADD COLUMN "latitud" DOUBLE PRECISION,
ADD COLUMN "longitud" DOUBLE PRECISION;

ALTER TABLE "ParteUso" ADD COLUMN "motivoUso" TEXT,
ADD COLUMN "parteDetalle" TEXT;

-- Opción "Otro" del selector de uso: el catálogo de usos es una relación obligatoria (usoId), así que
-- "Otro" es una fila más del catálogo; lo que la persona escribe va en ParteUso.motivoUso.
INSERT INTO "Uso" ("id", "nombre", "descripcion")
VALUES (gen_random_uuid()::text, 'Otro', 'Uso no listado en el catálogo: se describe en el motivo de la propuesta')
ON CONFLICT ("nombre") DO NOTHING;
