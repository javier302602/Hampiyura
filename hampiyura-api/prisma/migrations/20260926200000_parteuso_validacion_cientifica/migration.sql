-- Camino de "Tradicional" a validado científicamente (M-04/M-09): contacto interno de seguimiento y evidencia.
ALTER TABLE "ParteUso" ADD COLUMN "contactoSeguimiento" TEXT,
ADD COLUMN "valCientEspecialista" TEXT,
ADD COLUMN "valCientFecha" TIMESTAMP(3),
ADD COLUMN "valCientEvidencia" TEXT,
ADD COLUMN "valCientEnlace" TEXT,
ADD COLUMN "valCientRegistradaPorId" TEXT,
ADD COLUMN "valCientRegistradaEn" TIMESTAMP(3);

-- RF-257: un uso "Científico" sin evidencia registrada NO se muestra como verificado. Los usos ya existentes marcados
-- Científico quedan, por eso, sin sello hasta que el equipo registre su evidencia (no se inventa ninguna).
