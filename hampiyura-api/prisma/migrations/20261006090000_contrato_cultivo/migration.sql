CREATE TABLE "ContratoCultivo" (
  "id" TEXT NOT NULL,
  "cultivoId" TEXT NOT NULL,
  "plantaId" TEXT NOT NULL,
  "plantaNombre" TEXT NOT NULL,
  "agricultorId" TEXT NOT NULL,
  "compradorId" TEXT NOT NULL,
  "cantidad" TEXT NOT NULL,
  "montoAcordado" DOUBLE PRECISION NOT NULL,
  "montoAdelanto" DOUBLE PRECISION NOT NULL,
  "montoSaldo" DOUBLE PRECISION NOT NULL,
  "comisionReferencial" DOUBLE PRECISION NOT NULL,
  "netoAgricultor" DOUBLE PRECISION NOT NULL,
  "mensajeComprador" TEXT,
  "cobroMedio" TEXT,
  "cobroNumero" TEXT,
  "comprobanteAdelantoUrl" TEXT,
  "numeroOperacionAdelanto" TEXT,
  "motivoRechazo" TEXT,
  "motivoRechazoAdelanto" TEXT,
  "estado" TEXT NOT NULL,
  "eventos" JSONB NOT NULL,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContratoCultivo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContratoCultivo_compradorId_idx" ON "ContratoCultivo"("compradorId");
CREATE INDEX "ContratoCultivo_agricultorId_idx" ON "ContratoCultivo"("agricultorId");
