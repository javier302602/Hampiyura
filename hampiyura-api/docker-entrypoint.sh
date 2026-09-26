#!/bin/sh
# Arranque de la API en Docker: (1) secreto JWT, (2) migraciones, (3) seed idempotente, (4) datos de las plantas, (5) servidor.
set -e

# Si no definiste JWT_SECRET en .env, se genera uno aleatorio una sola vez y se guarda en el volumen
# "state" (así los tokens siguen siendo válidos entre reinicios y nadie usa un secreto conocido).
if [ -z "$JWT_SECRET" ]; then
  [ -s state/jwt_secret ] || node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))" > state/jwt_secret
  JWT_SECRET="$(cat state/jwt_secret)"
  export JWT_SECRET
fi

echo "[hampiyura] aplicando migraciones..."
npx prisma migrate deploy
echo "[hampiyura] cargando datos base (seed idempotente)..."
npx tsx prisma/seed.ts
# Datos reales de las rondas 28 a 31, en este orden (cada script depende del anterior): las 27 plantas y sus usos, fichas (foto, hábitat,
# preparaciones, distribución natural), sellos de validación científica y estado de conservación. Todos son IDEMPOTENTES: reiniciar no
# duplica nada. Necesitan una cuenta Administrador activa (la crea el seed con SEED_ADMIN_CORREO/SEED_ADMIN_PASSWORD).
# Un fallo aquí NO tumba la API: se deja bien visible en el log y el contenedor arranca igual con lo que sí se haya cargado.
# CARGAR_DATOS_PLANTAS=false los omite (p. ej. en un servidor con datos propios).
fallos=""
if [ "${CARGAR_DATOS_PLANTAS:-true}" = "true" ]; then
  for s in cargar-plantas-documentos cargar-fichas-plantas registrar-validacion-cientifica cargar-conservacion; do
    echo "[hampiyura] cargando datos de plantas: $s ..."
    if ! npx tsx "scripts/$s.ts" --aplicar; then
      echo "[hampiyura] !!!!! ERROR: scripts/$s.ts FALLÓ (la API arranca igual, con datos parciales). Revisa el mensaje de arriba. !!!!!"
      fallos="$fallos $s"
    fi
  done
  if [ -n "$fallos" ]; then echo "[hampiyura] !!!!! DATOS INCOMPLETOS: fallaron:$fallos !!!!!"; echo "[hampiyura] Causa habitual: falta la cuenta Administrador (define SEED_ADMIN_CORREO y SEED_ADMIN_PASSWORD en .env) o quedó un volumen viejo (docker compose down -v)."; else echo "[hampiyura] datos de plantas cargados"; fi
else
  echo "[hampiyura] CARGAR_DATOS_PLANTAS=false: se omite la carga de datos de plantas"
fi

echo "[hampiyura] iniciando API en el puerto $PORT"
exec node dist/main.js
