#!/bin/sh
# Arranque de la API en Docker: (1) secreto JWT, (2) migraciones, (3) seed idempotente, (4) servidor.
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
echo "[hampiyura] iniciando API en el puerto $PORT"
exec node dist/main.js
