-- Ronda 22: la guía de cultivo pasa de 3 columnas a un JSON con todas las secciones. Se conserva lo ya escrito.
ALTER TABLE "Cultivo" ADD COLUMN "guia" JSONB;
UPDATE "Cultivo"
SET "guia" = jsonb_strip_nulls(jsonb_build_object('suelo', "guiaSuelo", 'nutrientes', "guiaNutrientes", 'herramientas', "guiaHerramientas"))
WHERE "guiaSuelo" IS NOT NULL OR "guiaNutrientes" IS NOT NULL OR "guiaHerramientas" IS NOT NULL;
ALTER TABLE "Cultivo" DROP COLUMN "guiaSuelo", DROP COLUMN "guiaNutrientes", DROP COLUMN "guiaHerramientas";
