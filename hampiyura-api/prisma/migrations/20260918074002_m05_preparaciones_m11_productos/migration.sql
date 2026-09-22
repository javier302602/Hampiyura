-- AlterTable
ALTER TABLE "Preparacion" ADD COLUMN     "formaTradicionalElaboracion" TEXT NOT NULL,
ADD COLUMN     "parteUsoId" TEXT NOT NULL,
ALTER COLUMN "contraindicaciones" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "estado",
DROP COLUMN "etiquetaRevisado",
ADD COLUMN     "cantidad" TEXT,
ADD COLUMN     "documentacionCertificacion" TEXT,
ADD COLUMN     "estadoValidacion" "EstadoValidacion" NOT NULL,
ADD COLUMN     "fechaElaboracion" TIMESTAMP(3),
ADD COLUMN     "fotografias" TEXT[],
ADD COLUMN     "informacionProceso" TEXT NOT NULL,
ADD COLUMN     "plantasIds" TEXT[],
ADD COLUMN     "presentacion" TEXT,
ADD COLUMN     "requiereRevisionReforzada" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "descripcion" DROP NOT NULL,
ALTER COLUMN "ingredientes" DROP NOT NULL,
ALTER COLUMN "precioReferencial" DROP NOT NULL,
ALTER COLUMN "etiquetaValidadoDocumental" SET DEFAULT false,
ALTER COLUMN "etiquetaCertificado" SET DEFAULT false;

-- AddForeignKey
ALTER TABLE "Preparacion" ADD CONSTRAINT "Preparacion_parteUsoId_fkey" FOREIGN KEY ("parteUsoId") REFERENCES "ParteUso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preparacion" ADD CONSTRAINT "Preparacion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_productorId_fkey" FOREIGN KEY ("productorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

