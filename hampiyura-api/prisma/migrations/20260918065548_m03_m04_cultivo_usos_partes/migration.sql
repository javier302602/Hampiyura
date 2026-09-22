/*
  Warnings:

  - You are about to drop the column `enfermedadesTratadas` on the `ParteUso` table. All the data in the column will be lost.
  - You are about to drop the column `usoDescrito` on the `ParteUso` table. All the data in the column will be lost.
  - Added the required column `consejosRecoleccion` to the `Cultivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autorId` to the `ParteUso` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoConocimiento` to the `ParteUso` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usoId` to the `ParteUso` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cultivo" ADD COLUMN     "consejosRecoleccion" TEXT NOT NULL,
ADD COLUMN     "mesesCosecha" INTEGER[],
ADD COLUMN     "mesesSiembra" INTEGER[];

-- AlterTable
ALTER TABLE "ParteUso" DROP COLUMN "enfermedadesTratadas",
DROP COLUMN "usoDescrito",
ADD COLUMN     "autorId" TEXT NOT NULL,
ADD COLUMN     "preparacionId" TEXT,
ADD COLUMN     "tipoConocimiento" TEXT NOT NULL,
ADD COLUMN     "usoId" TEXT NOT NULL,
ALTER COLUMN "contraindicaciones" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Uso" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Uso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Uso_nombre_key" ON "Uso"("nombre");

-- AddForeignKey
ALTER TABLE "ParteUso" ADD CONSTRAINT "ParteUso_usoId_fkey" FOREIGN KEY ("usoId") REFERENCES "Uso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
