-- Ronda 20: el plan "Empresarial" pasa a llamarse "Institucional" (S/ 120). Los pagos ya registrados conservan su
-- monto original; solo cambia el nombre del plan para que sigan dando el mismo acceso.
UPDATE "PagoContacto" SET "plan" = 'Institucional' WHERE "plan" = 'Empresarial';
