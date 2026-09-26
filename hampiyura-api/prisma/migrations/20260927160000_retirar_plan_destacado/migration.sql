-- Ronda 21: se retira el plan "Productor Destacado". Historial: los pagos ya CONFIRMADOS/RECHAZADOS de ese plan se conservan
-- tal cual (solo dejan de dar algún beneficio: ya no existe prioridad en el directorio). Los que estaban PENDIENTES de
-- confirmar se rechazan con un motivo claro, para que nadie quede esperando un plan que ya no existe.
UPDATE "PagoContacto"
SET "estado" = 'Rechazado',
    "motivoRechazo" = 'El plan Productor Destacado se retiró del catálogo',
    "revisadoEn" = NOW()
WHERE "plan" = 'Destacado' AND "estado" = 'Pendiente';
