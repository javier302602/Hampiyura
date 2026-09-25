#!/usr/bin/env bash
# Actualiza un servidor ya desplegado a la última versión del repositorio.
#
#   Uso (como root o con sudo):   sudo /opt/hampiyura/deploy/update.sh
#
# Las compilaciones se hacen como el usuario `hampiyura` (así no quedan archivos de root en el
# proyecto) y el reinicio del backend como root. Si lo ejecutas directamente como `hampiyura`, el
# reinicio usa `sudo systemctl restart hampiyura-api`.
#
# RESTART_CMD sustituye el comando de reinicio; por ejemplo con pm2:
#   sudo RESTART_CMD="sudo -u hampiyura pm2 restart hampiyura-api" /opt/hampiyura/deploy/update.sh
set -euo pipefail
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ "$(id -u)" -eq 0 ]; then
  COMO=(runuser -u hampiyura --)
  RESTART_CMD="${RESTART_CMD:-systemctl restart hampiyura-api}"
else
  COMO=()
  RESTART_CMD="${RESTART_CMD:-sudo systemctl restart hampiyura-api}"
fi

# Ejecuta un comando dentro de una carpeta, como el usuario de la aplicación.
en() { local dir="$1"; shift; "${COMO[@]}" bash -c "cd '$dir' && $*"; }

echo "==> Trayendo cambios"
en "$RAIZ" "git pull --ff-only"

echo "==> Backend: dependencias, migraciones y build"
en "$RAIZ/hampiyura-api" "npm ci && npm run migrate:deploy && npm run build"

echo "==> Frontend: dependencias y build (nginx sirve hampiyura-web/dist directamente)"
en "$RAIZ/hampiyura-web" "npm ci && npm run build"

echo "==> Reiniciando el backend: $RESTART_CMD"
$RESTART_CMD

echo "==> Listo. Comprueba:  curl -s http://127.0.0.1:3000/api/usos | head -c 120"
