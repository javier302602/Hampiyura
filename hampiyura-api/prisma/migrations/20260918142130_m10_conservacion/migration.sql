-- AlterTable
ALTER TABLE "AccionConservacion" DROP COLUMN "estadoConservacionId",
ADD COLUMN     "autorId" TEXT NOT NULL,
ADD COLUMN     "plantaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "EstadoConservacion" DROP COLUMN "tipoConocimiento",
ADD COLUMN     "alternativasCultivo" TEXT NOT NULL,
ADD COLUMN     "autorId" TEXT NOT NULL,
ADD COLUMN     "disponibilidadTemporada" TEXT NOT NULL,
ADD COLUMN     "estadoValidacion" "EstadoValidacion" NOT NULL,
ADD COLUMN     "metodosPropagacion" TEXT NOT NULL,
ADD COLUMN     "recomendacionesConservacion" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "EstadoConservacion" ADD CONSTRAINT "EstadoConservacion_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstadoConservacion" ADD CONSTRAINT "EstadoConservacion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionConservacion" ADD CONSTRAINT "AccionConservacion_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionConservacion" ADD CONSTRAINT "AccionConservacion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

