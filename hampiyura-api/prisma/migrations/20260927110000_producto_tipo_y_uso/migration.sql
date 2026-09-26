ALTER TABLE "Producto" ADD COLUMN "tipoProductor" TEXT,
ADD COLUMN "categoriasUso" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "modoDeUso" TEXT,
ADD COLUMN "contraindicaciones" TEXT;
