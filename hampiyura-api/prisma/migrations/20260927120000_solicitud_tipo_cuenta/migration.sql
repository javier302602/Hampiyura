ALTER TABLE "Usuario" ADD COLUMN "tipoCuenta" TEXT;

CREATE TABLE "SolicitudCuenta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoSolicitado" TEXT NOT NULL,
    "nombreOrganizacion" TEXT,
    "descripcion" TEXT NOT NULL,
    "identificacion" TEXT,
    "sitioWeb" TEXT,
    "estadoValidacion" "EstadoValidacion" NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudCuenta_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SolicitudCuenta_usuarioId_idx" ON "SolicitudCuenta"("usuarioId");

ALTER TABLE "SolicitudCuenta" ADD CONSTRAINT "SolicitudCuenta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
