-- M-15 · Contacto pagado y planes: pagos con comprobante (planes y desbloqueos puntuales).
CREATE TABLE "PagoContacto" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "plan" TEXT,
    "productorId" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodo" TEXT NOT NULL,
    "numeroOperacion" TEXT,
    "comprobanteUrl" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL,
    "revisadoPorId" TEXT,
    "revisadoEn" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "vigenteDesde" TIMESTAMP(3),
    "vigenteHasta" TIMESTAMP(3),

    CONSTRAINT "PagoContacto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PagoContacto_usuarioId_idx" ON "PagoContacto"("usuarioId");
CREATE INDEX "PagoContacto_estado_idx" ON "PagoContacto"("estado");

-- Perfil: campos básicos de contacto y presentación.
ALTER TABLE "Usuario" ADD COLUMN "telefono" TEXT,
ADD COLUMN "biografia" TEXT,
ADD COLUMN "nombreNegocio" TEXT;

-- Consulta (M-08): fotos y ubicación opcionales, sin depender de ningún plan.
ALTER TABLE "Consulta" ADD COLUMN "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "latitud" DOUBLE PRECISION,
ADD COLUMN "longitud" DOUBLE PRECISION;
