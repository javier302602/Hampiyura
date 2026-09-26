ALTER TABLE "Usuario" ADD COLUMN "disponibleHasta" TIMESTAMP(3),
  ADD COLUMN "disponibleNota" TEXT;

CREATE TABLE "Conversacion" (
  "id" TEXT NOT NULL,
  "compradorId" TEXT NOT NULL,
  "productorId" TEXT NOT NULL,
  "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Conversacion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Conversacion_compradorId_productorId_key" ON "Conversacion"("compradorId", "productorId");

CREATE TABLE "MensajeDirecto" (
  "id" TEXT NOT NULL,
  "conversacionId" TEXT NOT NULL,
  "autorId" TEXT NOT NULL,
  "texto" TEXT NOT NULL,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leidoEn" TIMESTAMP(3),
  CONSTRAINT "MensajeDirecto_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "MensajeDirecto" ADD CONSTRAINT "MensajeDirecto_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "Conversacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AlertaSeguimiento" (
  "id" TEXT NOT NULL,
  "usuarioId" TEXT NOT NULL,
  "plantaId" TEXT NOT NULL,
  "disponibilidad" BOOLEAN NOT NULL DEFAULT true,
  "temporada" BOOLEAN NOT NULL DEFAULT true,
  "productosNotificados" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "ultimaTemporada" TEXT,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlertaSeguimiento_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AlertaSeguimiento_usuarioId_plantaId_key" ON "AlertaSeguimiento"("usuarioId", "plantaId");

CREATE TABLE "BusquedaPlanta" (
  "id" TEXT NOT NULL,
  "plantaId" TEXT NOT NULL,
  "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusquedaPlanta_pkey" PRIMARY KEY ("id")
);
