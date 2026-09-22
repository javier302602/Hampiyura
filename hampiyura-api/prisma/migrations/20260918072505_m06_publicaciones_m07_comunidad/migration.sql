-- AlterTable
ALTER TABLE "Comentario" ADD COLUMN     "comentarioPadreId" TEXT,
ADD COLUMN     "publicacionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Publicacion" DROP COLUMN "estado",
DROP COLUMN "texto",
DROP COLUMN "videos",
ADD COLUMN     "descripcion" TEXT NOT NULL,
ADD COLUMN     "enfermedadesTratadas" TEXT NOT NULL,
ADD COLUMN     "estadoValidacion" "EstadoValidacion" NOT NULL,
ADD COLUMN     "formaPreparacion" TEXT NOT NULL,
ADD COLUMN     "fuente" TEXT NOT NULL,
ADD COLUMN     "nombreComun" TEXT NOT NULL,
ADD COLUMN     "plantaId" TEXT NOT NULL,
ADD COLUMN     "tipoConocimiento" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Valoracion" ADD COLUMN     "publicacionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Valoracion_publicacionId_autorId_key" ON "Valoracion"("publicacionId", "autorId");

-- AddForeignKey
ALTER TABLE "Publicacion" ADD CONSTRAINT "Publicacion_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publicacion" ADD CONSTRAINT "Publicacion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "Publicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_comentarioPadreId_fkey" FOREIGN KEY ("comentarioPadreId") REFERENCES "Comentario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valoracion" ADD CONSTRAINT "Valoracion_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "Publicacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

