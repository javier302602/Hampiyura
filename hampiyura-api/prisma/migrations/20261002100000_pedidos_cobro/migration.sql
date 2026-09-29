CREATE TABLE "CobroProducto" (
  "productoId" TEXT NOT NULL,
  "yape" TEXT,
  "plin" TEXT,
  "cuenta" TEXT,
  "entregaDias" INTEGER NOT NULL,
  "compromisoEn" TIMESTAMP(3) NOT NULL,
  "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CobroProducto_pkey" PRIMARY KEY ("productoId")
);

CREATE TABLE "Pedido" (
  "id" TEXT NOT NULL,
  "productoId" TEXT NOT NULL,
  "productoNombre" TEXT NOT NULL,
  "compradorId" TEXT NOT NULL,
  "vendedorId" TEXT NOT NULL,
  "cantidad" INTEGER NOT NULL,
  "precioUnitario" DOUBLE PRECISION NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  "comisionReferencial" DOUBLE PRECISION NOT NULL,
  "entregaNombre" TEXT NOT NULL,
  "entregaTelefono" TEXT NOT NULL,
  "entregaDireccion" TEXT NOT NULL,
  "cobro" JSONB NOT NULL,
  "metodoElegido" TEXT,
  "comprobanteUrl" TEXT,
  "numeroOperacion" TEXT,
  "estado" TEXT NOT NULL,
  "entregaDias" INTEGER NOT NULL,
  "fechaLimiteEntrega" TIMESTAMP(3),
  "contratoVersion" TEXT NOT NULL,
  "contratoTexto" TEXT NOT NULL,
  "compradorAceptoEn" TIMESTAMP(3) NOT NULL,
  "vendedorCompromisoEn" TIMESTAMP(3) NOT NULL,
  "notaEnvio" TEXT,
  "motivoRechazoPago" TEXT,
  "motivoReclamo" TEXT,
  "resolucion" TEXT,
  "eventos" JSONB NOT NULL,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Pedido_compradorId_idx" ON "Pedido"("compradorId");
CREATE INDEX "Pedido_vendedorId_idx" ON "Pedido"("vendedorId");
