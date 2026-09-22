/*
  Warnings:

  - Added the required column `entidadId` to the `Reporte` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha` to the `Reporte` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoEntidad` to the `Reporte` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `estado` on the `Reporte` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EstadoReporte" AS ENUM ('Pendiente', 'Revisado', 'Desestimado');

-- AlterEnum
ALTER TYPE "EstadoCuenta" ADD VALUE 'Suspendido';

-- AlterTable
ALTER TABLE "Reporte" ADD COLUMN     "entidadId" TEXT NOT NULL,
ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tipoEntidad" TEXT NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoReporte" NOT NULL;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
