-- CreateEnum
CREATE TYPE "TipoConsulta" AS ENUM ('PreguntaGeneral', 'ReporteInformacionIncorrecta', 'SolicitudRevisionPublicacion', 'SolicitudValidacionInformacion', 'ReportePlantaEnPeligro', 'ReporteProblemaCultivo', 'ConsultaSobrePublicacion');

-- CreateEnum
CREATE TYPE "EstadoConsulta" AS ENUM ('Pendiente', 'EnRevision', 'Respondida', 'Cerrada');

-- CreateEnum
CREATE TYPE "PrioridadConsulta" AS ENUM ('Normal', 'Alta');

-- CreateEnum
CREATE TYPE "AreaEspecialidad" AS ENUM ('Agronomia', 'PlantasMedicinales', 'Conservacion', 'Salud');

-- DropForeignKey
ALTER TABLE "MensajeConsulta" DROP CONSTRAINT "MensajeConsulta_consultaId_fkey";

-- AlterTable
ALTER TABLE "Consulta" DROP COLUMN "asunto",
DROP COLUMN "tareaAsignada",
ADD COLUMN     "areaAsignada" "AreaEspecialidad",
ADD COLUMN     "asignadoA" TEXT,
ADD COLUMN     "descripcion" TEXT NOT NULL,
ADD COLUMN     "fechaActualizacion" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fechaCreacion" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fechaPrimeraRespuestaEquipo" TIMESTAMP(3),
ADD COLUMN     "prioridad" "PrioridadConsulta" NOT NULL,
ALTER COLUMN "autorId" DROP NOT NULL,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoConsulta" NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoConsulta" NOT NULL;

-- AlterTable
ALTER TABLE "MensajeConsulta" DROP COLUMN "texto",
ADD COLUMN     "contenido" TEXT NOT NULL,
ADD COLUMN     "esEquipo" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "MensajeConsulta" ADD CONSTRAINT "MensajeConsulta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

