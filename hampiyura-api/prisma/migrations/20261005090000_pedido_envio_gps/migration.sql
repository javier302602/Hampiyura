ALTER TABLE "Pedido" ADD COLUMN "subtotal" DOUBLE PRECISION;
ALTER TABLE "Pedido" ADD COLUMN "costoEnvio" DOUBLE PRECISION;
ALTER TABLE "Pedido" ADD COLUMN "distanciaKm" DOUBLE PRECISION;
ALTER TABLE "Pedido" ADD COLUMN "entregaLatitud" DOUBLE PRECISION;
ALTER TABLE "Pedido" ADD COLUMN "entregaLongitud" DOUBLE PRECISION;
ALTER TABLE "Pedido" ADD COLUMN "entregaReferencia" TEXT;

-- Pedidos ya existentes (de antes de este cambio): no tenían envío calculado ni GPS de entrega.
-- Se completan con datos consistentes (subtotal = total anterior, envío 0, sin coordenadas reales)
-- para poder volver las columnas NOT NULL sin perder los pedidos ya creados.
UPDATE "Pedido" SET "subtotal" = "total", "costoEnvio" = 0, "entregaLatitud" = 0, "entregaLongitud" = 0 WHERE "subtotal" IS NULL;

ALTER TABLE "Pedido" ALTER COLUMN "subtotal" SET NOT NULL;
ALTER TABLE "Pedido" ALTER COLUMN "costoEnvio" SET NOT NULL;
ALTER TABLE "Pedido" ALTER COLUMN "entregaLatitud" SET NOT NULL;
ALTER TABLE "Pedido" ALTER COLUMN "entregaLongitud" SET NOT NULL;
