-- CreateTable
CREATE TABLE "UbicacionCultivo" (
    "id" TEXT NOT NULL,
    "cultivoId" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UbicacionCultivo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UbicacionCultivo" ADD CONSTRAINT "UbicacionCultivo_cultivoId_fkey" FOREIGN KEY ("cultivoId") REFERENCES "Cultivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionCultivo" ADD CONSTRAINT "UbicacionCultivo_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UbicacionCultivo" ADD CONSTRAINT "UbicacionCultivo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

