# HampiYura

Plataforma web de plantas medicinales amazónicas: catálogo con fotografías y usos, mapa de cultivos con
relieve, publicaciones y consultas a especialistas, directorio de productos de emprendedores y un flujo
de validación por especialistas para todo lo que la comunidad propone.

| Parte | Carpeta | Tecnología |
|---|---|---|
| Backend (API REST) | [`hampiyura-api/`](hampiyura-api) | Node.js + TypeScript, Express 5, Prisma, PostgreSQL, arquitectura hexagonal |
| Frontend (SPA) | [`hampiyura-web/`](hampiyura-web) | React 19 + TypeScript + Vite, React Router, Leaflet |
| Todo con Docker | [`docker-compose.yml`](docker-compose.yml) y un `Dockerfile` en cada carpeta | PostgreSQL 16 + API + frontend (nginx): `docker compose up -d --build` |
| Despliegue permanente | [`deploy/`](deploy) | `hampiyura-api.service` (systemd), `ecosystem.config.cjs` (pm2), `nginx.conf.example`, `update.sh` |
| Documentación de diseño | [`docs/`](docs) | Arquitectura, requisitos, actas |

---

## 1. Requisitos

| Herramienta | Versión | Notas |
|---|---|---|
| **Node.js** | **20 o superior** (probado con 22 LTS) | incluye `npm` |
| **PostgreSQL** | 14 o superior (probado con 16) | o Docker, ver más abajo |
| **git** | cualquiera | |
| Docker + Docker Compose | opcional | para levantarlo todo sin instalar nada más (sección 2), o solo la base de datos |

En Linux, Prisma necesita `openssl` instalado (`apt install openssl`). El paquete `bcrypt` trae binarios
precompilados; si tu sistema no los tiene y tiene que compilar, instala `build-essential` y `python3`.

---

## 2. Puesta en marcha con Docker (lo más fácil para probarlo)

Solo necesitas **Docker con Docker Compose** (Docker Desktop en Windows/Mac). No hace falta Node ni PostgreSQL.

```bash
git clone https://github.com/javier302602/Hampiyura.git
cd Hampiyura
cp .env.example .env            # en PowerShell: Copy-Item .env.example .env
docker compose up -d --build
```

La primera vez tarda unos minutos (compila la API y el frontend). Cuando termine, abre
**<http://localhost:8080>**. Ya hay datos: 26 usos medicinales y las **27 plantas** del proyecto con sus fichas (foto con crédito, hábitat, preparaciones, distribución natural), los sellos de validación científica y el estado de conservación (más 2 plantas "[DATO DE PRUEBA]" si `SEED_DATOS_DE_PRUEBA=true`). La primera vez el arranque tarda un minuto más porque carga esos datos; puedes seguirlo con `docker compose logs -f api`.

- **Cuenta Administrador:** `admin@hampiyura.local` / `HampiYura2026Demo` (valores de `.env`; cámbialos si el sitio será público).
- **API directa:** <http://localhost:3000/api/plantas>. La base de datos queda solo en `127.0.0.1:5432`.
- Si un puerto está ocupado, cambia `WEB_PORT`, `API_PORT` o `POSTGRES_PORT` en `.env` y repite `docker compose up -d`.

Qué levanta (`docker-compose.yml`): `db` (PostgreSQL 16, con healthcheck), `api` (espera a que `db` esté sana; al
arrancar aplica las migraciones de Prisma, el seed y la carga de las 27 plantas **solos**) y `web` (nginx con el frontend compilado, que reenvía
`/api` y `/uploads` a la API). **No hay caché** (Redis u otro): el proyecto no usa ninguno.
Las imágenes son de **producción** (código compilado, sin recarga en caliente); el secreto JWT se genera solo la primera vez.

```bash
docker compose logs -f api      # ver el arranque (migraciones, seed y carga de plantas)
docker compose down             # apagar (los datos se conservan)
docker compose down -v          # apagar y BORRAR datos, fotos subidas y secreto
docker compose up -d --build    # aplicar cambios del código tras un git pull
```

**¿Ves solo 3 plantas?** Casi seguro la imagen es vieja o el arranque falló al cargar los datos. Comprueba en el log de la API que
aparezca `datos de plantas cargados`; si aparece `DATOS INCOMPLETOS` o `ERROR: scripts/... FALLÓ`, el error está justo encima (la API
arranca igual con lo que sí se cargó). Para descartar una imagen o un volumen viejos, empieza limpio:

```bash
docker compose down -v --remove-orphans     # borra también la base de datos vieja
docker compose build --no-cache
docker compose up -d
curl http://localhost:3000/api/plantas      # debe devolver 27 plantas
```

La carga de las plantas necesita la cuenta Administrador del `.env` (`SEED_ADMIN_CORREO` y `SEED_ADMIN_PASSWORD`) y se puede apagar con
`CARGAR_DATOS_PLANTAS=false`.

**Cuentas reales del equipo (paso manual, NO automático).** El repositorio es público, así que las 12 cuentas del equipo
(`docs/usuarios-equipo.md`: 4 Administrador, 2 Especialista en salud, 2 en agronomía y 4 Usuario) no se crean solas ni sus contraseñas
están en git. Córrelo **una vez, DESPUÉS de que la API haya arrancado** (Docker o entorno local): el script crea cada cuenta solo si su correo
exacto no existe todavía, así que funciona aunque ya esté el administrador del seed, y puedes repetirlo sin duplicar nada.

```bash
cd hampiyura-api && npm ci
npx tsx scripts/crear-cuentas-equipo.ts             # simulación: muestra qué crearía, sin escribir nada
npx tsx scripts/crear-cuentas-equipo.ts --aplicar   # crea las que falten
```

Con Docker, apunta el script a la base del contenedor (ajusta el puerto si cambiaste `POSTGRES_PORT`; en PowerShell usa
`$env:DATABASE_URL="..."; npx tsx scripts/crear-cuentas-equipo.ts --aplicar`):

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hampiyura" npx tsx scripts/crear-cuentas-equipo.ts --aplicar
```

Las contraseñas se **generan al azar en tu máquina** (18 caracteres, distintas en cada cuenta) y se escriben **solo** en
`credenciales-equipo-<fecha>.txt` en la raíz del proyecto (ignorado por git: nunca se commitea ni se imprime en la terminal). Entrégalas a cada
persona por un canal privado y luego borra el archivo. Si corres el script otra vez el mismo día y falta alguna cuenta, sus claves se **añaden**
al final del mismo archivo. Cada persona debe cambiar su clave desde *Mi perfil*.

**¿No puedes iniciar sesión ("Credenciales inválidas")?** Ese mensaje sale si la cuenta NO existe en la base a la que se conecta la API
o si la clave no coincide. Nunca es "un bug de la clave": lo más común es usar la clave de OTRO entorno (cada instalación genera claves
distintas) o haber creado las cuentas en otra base. Con Docker, en este orden (todo **dentro del contenedor de la API**, que es la base real):

```bash
# 1) ¿A qué base está conectada la API y existen las 12 cuentas y están Activas? (no modifica nada; no imprime claves)
docker compose exec api npx tsx scripts/diagnosticar-login.ts
# opcional: ¿esta clave concreta valida para este correo?
docker compose exec -e CLAVE_PRUEBA="la-clave" api npx tsx scripts/diagnosticar-login.ts junior@hampiyura.local

# 2) Si faltan cuentas: créalas (solo crea las que faltan)
docker compose exec -e CREDENCIALES_ARCHIVO=/app/state/credenciales-equipo.txt api npx tsx scripts/crear-cuentas-equipo.ts --aplicar

# 3) Si existen pero nadie sabe la clave: restablece TODAS con claves nuevas (o solo algunas con --correo=...)
docker compose exec -e CREDENCIALES_ARCHIVO=/app/state/credenciales-equipo.txt api npx tsx scripts/restablecer-claves-equipo.ts --aplicar

# 4) Lee las claves nuevas (solo tú), pásalas por un canal privado y BORRA el archivo
docker compose exec api cat /app/state/credenciales-equipo.txt
docker compose exec api rm /app/state/credenciales-equipo.txt
```

El archivo se escribe en `/app/state`, que es un **volumen**: sobrevive a reinicios y a `docker compose up -d --build`. Si NO usas
`CREDENCIALES_ARCHIVO`, se escribe fuera de un volumen y se pierde al recrear el contenedor. En **Git Bash de Windows** antepón
`MSYS_NO_PATHCONV=1` al comando (si no, cambia `/app/state` por una ruta de Windows). El correo no distingue mayúsculas ni espacios
alrededor; la clave sí distingue todo y no admite espacios al copiarla. El administrador del seed (`SEED_ADMIN_*`) entra con la clave del `.env`
(cámbiala si el sitio es público; para restablecerla: `--correo=admin@hampiyura.local`).

**Plan B (sin Docker para la API/frontend):** `docker compose up -d db` levanta solo PostgreSQL y el resto se corre a
mano con `npm` (sección 2b). Si prefieres tu propio PostgreSQL, crea una base vacía `hampiyura`, apunta `DATABASE_URL`
a ella y ejecuta `npx prisma migrate deploy` (crea todas las tablas) y `npm run seed` (datos base), y después los cuatro scripts de datos de
la sección 4 (sin ellos solo tendrás las 3 plantas base).

---

## 2b. Puesta en marcha en desarrollo con Node (paso a paso, desde cero)

```bash
# 1) Clonar
git clone https://github.com/javier302602/Hampiyura.git
cd Hampiyura

# 2) Base de datos (opción Docker). Si ya tienes Postgres, salta al paso 3 y crea una BD vacía llamada "hampiyura".
docker compose up -d db

# 3) Backend
cd hampiyura-api
cp .env.example .env            # revisa DATABASE_URL (ver sección 3)
npm ci
npx prisma migrate deploy       # crea las tablas
SEED_ADMIN_CORREO="admin@ejemplo.com" SEED_ADMIN_PASSWORD="ClaveSegura123" npm run seed
npm run dev                     # API en http://localhost:3000

# 4) Frontend (otra terminal)
cd hampiyura-web
npm ci
npm run dev                     # App en http://localhost:5173
```

Abre <http://localhost:5173> e inicia sesión con el administrador que creaste en el paso 3.
En desarrollo, Vite reenvía `/api` y `/uploads` al backend (ver `hampiyura-web/vite.config.ts`), así que
no hace falta configurar nada más.

> En Windows PowerShell define las variables así: `$env:SEED_ADMIN_CORREO="admin@ejemplo.com"; $env:SEED_ADMIN_PASSWORD="ClaveSegura123"; npm run seed`

---

## 3. Variables de entorno (`hampiyura-api/.env`)

El frontend **no usa variables de entorno**: llama a `/api` en el mismo dominio.
Copia `hampiyura-api/.env.example` a `.env` (el `.env` real nunca se sube al repositorio).

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL: `postgresql://USUARIO:CLAVE@HOST:PUERTO/BASE`. Con el `docker-compose.yml` por defecto: `postgresql://postgres:postgres@localhost:5432/hampiyura`. |
| `JWT_SECRET` | **Sí en producción** | Secreto para firmar las sesiones. Con `NODE_ENV=production` el servidor **se niega a arrancar** si falta, es un valor de ejemplo o tiene menos de 32 caracteres. Genera uno con `openssl rand -hex 32`. |
| `NODE_ENV` | Recomendada | Ponla en `production` en el servidor real. |
| `PORT` | No | Puerto del backend (por defecto `3000`). |
| `SEED_ADMIN_CORREO`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NOMBRE` | Solo al correr el seed | Crea la cuenta Administrador inicial (ver sección 4). |
| `SEED_DATOS_DE_PRUEBA` | No | `true` agrega 2 plantas `[DATO DE PRUEBA]`. **Solo para desarrollo.** |

Para el contenedor de Postgres (`docker-compose.yml`) puedes definir `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`POSTGRES_DB` y `POSTGRES_PORT` en un archivo `.env` en la raíz del repo; si cambias la contraseña, usa la
misma en `DATABASE_URL`.

---

## 4. Base de datos: migraciones y seed

```bash
cd hampiyura-api
npx prisma migrate deploy   # aplica las migraciones (npm run migrate:deploy es un atajo)
npm run seed                # datos base + admin inicial opcional
```

El seed es **idempotente** (puedes correrlo en cada despliegue sin duplicar nada) y carga:

- **25 usos/finalidades** medicinales (Digestivo, Respiratorio, Antiinflamatorio, Analgésico, … Ritual/Espiritual):
  son los que alimentan el filtro "Categoría / propiedad" del buscador.
- **3 plantas base** del catálogo: Uña de gato, Sangre de grado y Chuchuhuasi (sus fotografías se asocian
  automáticamente por nombre científico).
- **Cuenta Administrador** solo si defines `SEED_ADMIN_CORREO` y `SEED_ADMIN_PASSWORD`
  (mínimo 8 caracteres, con letras y números). Si el correo ya existe, se le asegura el rol Administrador
  sin tocar su contraseña.

### Datos de las 27 plantas (rondas 28 a 31)

El seed solo trae las 3 plantas base. Las **27 plantas reales** con sus usos, fichas, sellos y conservación se cargan con cuatro scripts
**idempotentes** (dentro de `hampiyura-api`), en este orden. Necesitan una cuenta Administrador activa (el seed la crea con
`SEED_ADMIN_*`). Sin `--aplicar` solo simulan y muestran qué harían. **Con Docker esto ya se hace solo en cada arranque.**

```bash
npx tsx scripts/cargar-plantas-documentos.ts --aplicar       # 27 plantas y sus 66 combinaciones Parte+Uso
npx tsx scripts/cargar-fichas-plantas.ts --aplicar           # foto (con crédito), hábitat, preparaciones y distribución natural
npx tsx scripts/registrar-validacion-cientifica.ts --aplicar # sello "verificado" en 22 usos Científicos
npx tsx scripts/cargar-conservacion.ts --aplicar             # estado de conservación (IUCN + D.S. 043-2006-AG)
```

**Sin administrador la app queda sin moderación**: el rol no se puede autoasignar desde la interfaz.
Con el admin creado, el resto de roles (Especialista, Productor, otro Administrador) se asignan desde
*Gestión → Usuarios*.

### Roles

| Rol | Puede |
|---|---|
| Visitante (sin cuenta) | Explorar catálogo, mapa, productos y publicaciones; enviar una consulta |
| Usuario registrado | Lo anterior + proponer plantas, publicar, comentar |
| Productor / cuenta de empresa | Publicar productos en el directorio |
| Especialista (Agrónomo / Conservación / Salud) | Validar contenido de su área en la bandeja |
| Administrador | Todo, incluida la validación de plantas, productos y publicaciones y la gestión de usuarios |

Todo lo que propone la comunidad (plantas, productos, publicaciones…) queda **Pendiente** hasta que un
validador lo aprueba en *Gestión → Bandeja de validación*.

---

## 5. Despliegue en producción (permanente, sobrevive a cerrar la terminal y a reinicios)

`npm run dev` y `npm start` en primer plano **mueren al cerrar la terminal o perder la conexión SSH**. En un
servidor real cada pieza la gestiona el sistema:

| Pieza | Quién la mantiene viva | Arranca sola al reiniciar |
|---|---|---|
| Frontend (archivos estáticos de `hampiyura-web/dist`) | **nginx** (servicio de systemd) | sí (`systemctl enable nginx`) |
| Backend (Node, `dist/main.js`) | **systemd** (`deploy/hampiyura-api.service`) — o **pm2** como alternativa | sí (`systemctl enable`) |
| PostgreSQL | servicio `postgresql` del sistema (o Docker con `restart: unless-stopped`) | sí |

Los pasos de abajo suponen **Debian 12 / Ubuntu 22.04+**, se ejecutan como **root** (o con `sudo`) y dejan el
código en `/opt/hampiyura`. Están probados de principio a fin en un Debian 12 con systemd real, incluido
un reinicio del servidor (ver sección 5.8).

### 5.1 Preparar el servidor

```bash
# Paquetes: nginx, PostgreSQL, git, openssl y Node.js 22 (repositorio oficial NodeSource)
apt-get update && apt-get install -y curl ca-certificates git openssl nginx postgresql sudo
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs
systemctl enable --now postgresql nginx     # normalmente apt ya los arranca; así te aseguras y quedan habilitados al arranque

# Base de datos (elige tu propia contraseña)
sudo -u postgres psql -c "CREATE USER hampiyura WITH PASSWORD 'CAMBIA_ESTA_CLAVE';"
sudo -u postgres psql -c "CREATE DATABASE hampiyura OWNER hampiyura;"

# Usuario de sistema sin login (la app NO corre como root) y código
adduser --system --group --home /opt/hampiyura hampiyura
git clone https://github.com/javier302602/Hampiyura.git /opt/hampiyura
chown -R hampiyura:hampiyura /opt/hampiyura
chmod 755 /opt/hampiyura          # nginx (www-data) necesita poder leer hampiyura-web/dist
```

> ¿Prefieres PostgreSQL en Docker? Omite `postgresql` y las dos líneas de `psql`, y ejecuta
> `docker compose up -d db` en `/opt/hampiyura` (el contenedor ya trae `restart: unless-stopped`);
> `DATABASE_URL` queda como en `.env.example`.

### 5.2 Backend: configuración, migraciones, seed y build

```bash
# 1) Configuración (el .env real nunca se sube a git)
sudo -u hampiyura cp /opt/hampiyura/hampiyura-api/.env.example /opt/hampiyura/hampiyura-api/.env
chmod 600 /opt/hampiyura/hampiyura-api/.env
nano /opt/hampiyura/hampiyura-api/.env
#    DATABASE_URL="postgresql://hampiyura:CAMBIA_ESTA_CLAVE@localhost:5432/hampiyura"
#    JWT_SECRET="<salida de: openssl rand -hex 32>"
#    NODE_ENV=production     (descomenta la línea)

# 2) Dependencias, migraciones, datos base (con el admin inicial la primera vez) y compilación
sudo -u hampiyura bash -c '
  cd /opt/hampiyura/hampiyura-api &&
  npm ci &&
  npm run migrate:deploy &&
  SEED_ADMIN_CORREO="admin@tu-dominio.com" SEED_ADMIN_PASSWORD="UnaClaveSegura123" npm run seed &&
  npm run build'
```

### 5.3 Frontend: build y nginx

```bash
sudo -u hampiyura bash -c 'cd /opt/hampiyura/hampiyura-web && npm ci && npm run build'   # -> hampiyura-web/dist/

cp /opt/hampiyura/deploy/nginx.conf.example /etc/nginx/conf.d/hampiyura.conf
nano /etc/nginx/conf.d/hampiyura.conf        # cambia server_name por tu dominio (o "_" si usas la IP)
rm -f /etc/nginx/sites-enabled/default       # quita el sitio de bienvenida de nginx
nginx -t && systemctl enable --now nginx && systemctl reload nginx
```

nginx sirve `hampiyura-web/dist` directamente (con *fallback* a `index.html` para React Router) y reenvía
`/api/` y `/uploads/` al backend. No necesita ningún gestor de procesos adicional. Añade HTTPS con
[certbot](https://certbot.eff.org): `apt-get install -y certbot python3-certbot-nginx && certbot --nginx`.

> `npm run preview` y `npm run dev` **no** son para producción (no reenvían `/api` y mueren con la terminal).

### 5.4 Backend permanente con systemd (recomendado)

```bash
cp /opt/hampiyura/deploy/hampiyura-api.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now hampiyura-api      # enable = arranca solo al reiniciar; --now = arranca ya
systemctl status hampiyura-api --no-pager
curl -s http://127.0.0.1:3000/api/usos | head -c 100     # debe devolver JSON con las categorías
```

Qué te da la unidad ([`deploy/hampiyura-api.service`](deploy/hampiyura-api.service)): corre como el usuario
`hampiyura` (no root), lee el `.env` de `hampiyura-api/`, **se reinicia sola a los 3 s si se cae**
(`Restart=always`), arranca con el servidor (`WantedBy=multi-user.target`), guarda los logs en el journal y
solo puede escribir en `hampiyura-api/uploads` (`ProtectSystem=strict`).
Si `which node` no da `/usr/bin/node`, corrige `ExecStart` en la unidad.

| Acción | Comando |
|---|---|
| Ver el estado | `systemctl status hampiyura-api` |
| **Ver logs en vivo** | `journalctl -u hampiyura-api -f` |
| Ver los últimos logs | `journalctl -u hampiyura-api -n 100 --no-pager` |
| Logs de la última hora | `journalctl -u hampiyura-api --since "1 hour ago"` |
| **Reiniciar** | `systemctl restart hampiyura-api` |
| **Detener** | `systemctl stop hampiyura-api` |
| Volver a iniciar | `systemctl start hampiyura-api` |
| Que NO arranque al reiniciar el servidor | `systemctl disable hampiyura-api` |
| Logs de nginx | `journalctl -u nginx -f`  ·  `tail -f /var/log/nginx/error.log` |

### 5.5 Alternativa: pm2 en lugar de systemd

Usa **una u otra** (las dos a la vez pelearían por el puerto 3000; si cambias de una a otra, desactiva la anterior:
`systemctl disable --now hampiyura-api` o `sudo -u hampiyura pm2 delete all`). Si prefieres pm2:

```bash
npm install -g pm2
sudo -u hampiyura pm2 start /opt/hampiyura/deploy/ecosystem.config.cjs   # arranca el backend (build de producción, dist/main.js)
sudo -u hampiyura pm2 save                                              # guarda la lista de procesos
pm2 startup systemd -u hampiyura --hp /opt/hampiyura                     # como root: crea y habilita el servicio pm2-hampiyura
```

El último comando, ejecutado como root, escribe `/etc/systemd/system/pm2-hampiyura.service` y lo habilita: al
arrancar el servidor, systemd lo inicia y pm2 resucita los procesos guardados con `pm2 save`. (Si lo ejecutas como
otro usuario, pm2 solo imprime un comando `sudo env PATH=… pm2 startup …` que debes copiar y ejecutar como root.)
Vuelve a hacer `pm2 save` cada vez que cambies la lista de procesos.

Todos los comandos de pm2 se ejecutan **como el usuario `hampiyura`**, que es el dueño del daemon:

| Acción | Comando |
|---|---|
| Ver el estado | `sudo -u hampiyura pm2 status` |
| **Ver logs en vivo** | `sudo -u hampiyura pm2 logs hampiyura-api` (Ctrl+C para salir; los archivos están en `/opt/hampiyura/.pm2/logs/`) |
| **Reiniciar** | `sudo -u hampiyura pm2 restart hampiyura-api` |
| **Detener** | `sudo -u hampiyura pm2 stop hampiyura-api` |
| Volver a iniciar | `sudo -u hampiyura pm2 start hampiyura-api` |
| Quitarlo de pm2 | `sudo -u hampiyura pm2 delete hampiyura-api && sudo -u hampiyura pm2 save` |
| Quitar el arranque automático | `pm2 unstartup systemd -u hampiyura --hp /opt/hampiyura` |

### 5.6 Actualizar a una versión nueva

```bash
sudo /opt/hampiyura/deploy/update.sh
```

Hace `git pull`, `npm ci` + migraciones + build del backend, `npm ci` + build del frontend (nginx ya lo sirve
desde `dist/`, no hay que copiar nada) y reinicia el backend. Con pm2:
`sudo RESTART_CMD="sudo -u hampiyura pm2 restart hampiyura-api" /opt/hampiyura/deploy/update.sh`.
Tras el reinicio el backend tarda ~1 s en volver a escuchar: si haces `curl` justo al terminar y da error, repítelo.

### 5.7 Notas y checklist antes de exponerlo

- Las fotos subidas viven en `hampiyura-api/uploads/` (ruta relativa al directorio de trabajo del backend):
  esa carpeta debe **persistir** y entrar en tus copias de seguridad, junto con la base de datos.
- [ ] `NODE_ENV=production` y un `JWT_SECRET` propio (≥ 32 caracteres); el servidor no arranca sin él.
- [ ] Contraseña de Postgres distinta de `postgres`; el puerto 5432 **no** expuesto a internet
      (el paquete `postgresql` de Debian y el `docker-compose.yml` ya escuchan solo en localhost).
- [ ] HTTPS activo (certbot) y un firewall que solo deje entrar 22, 80 y 443.
- [ ] Cobro de planes (M-15): define `PAGO_YAPE_NUMERO` / `PAGO_PLIN_NUMERO` (y `_TITULAR`) en `hampiyura-api/.env`. Los pagos se confirman a mano desde Gestión → Pagos y planes.
  El botón "Usar mi ubicación actual" (Proponer planta) usa el GPS del navegador, que **solo funciona en HTTPS** (o localhost): sin certificado el navegador lo bloquea y la persona debe marcar el punto a mano en el mapa.
- [ ] Copias de seguridad periódicas: `sudo -u postgres pg_dump hampiyura > respaldo.sql` y `hampiyura-api/uploads/`.
- [ ] Quita `SEED_ADMIN_PASSWORD` del entorno tras el primer seed y cambia la clave del admin.
- El backend no incluye *rate limiting* ni `helmet`; si lo expones a mucho tráfico, ponlos delante (nginx `limit_req`) o añádelos.

### 5.8 Cómo se verificó que sobrevive (y hasta dónde)

Probado en un **Debian 12 con systemd real como PID 1** (contenedor privilegiado de Docker: PostgreSQL 15, nginx,
Node 22), aplicando las secciones 5.1–5.6 tal cual (única diferencia: `git clone` desde una copia local del repo).

| Comprobación | Resultado |
|---|---|
| El backend no depende de ninguna sesión de terminal/SSH | Su proceso cuelga de systemd (PPID 1, cgroup `system.slice`), 0 sesiones de login abiertas, y responde desde fuera del servidor |
| **Reinicio completo del servidor** (apagado y arranque completos de systemd, sin ejecutar nada después) | PostgreSQL, nginx y `hampiyura-api` vuelven solos (`enabled`); la API responde 200 a los **6 s**; datos (usuarios, categorías) y fotos subidas intactos |
| Lo mismo con **pm2** (`pm2 save` + `pm2 startup`) | Tras reiniciar, el servicio `pm2-hampiyura` resucita el backend (padre: el daemon de pm2); API 200 a los 4 s |
| `kill -9` al proceso | systemd lo relanza con otro PID en ~3 s (pm2: en ~5 s) |
| Postgres caído con el backend en marcha | El backend sigue vivo (responde error) y se recupera solo al volver la base, sin reiniciarlo |
| Subida de fotos bajo el sandbox de la unidad | Se guarda en `uploads/` y nginx la sirve; fuera de `uploads/` el sistema es de solo lectura |
| `update.sh` (systemd y pm2) | Trae commits nuevos con `git pull`, migra, compila y reinicia; no deja archivos de root en el proyecto |

**Límites honestos:** no fue un VPS físico ni una conexión SSH real (se comprobó que el proceso es independiente de
cualquier sesión), y el "reinicio" es el de un contenedor cuyo PID 1 es systemd — ejercita el apagado y el arranque
completos de todos los servicios, pero no un corte de energía ni el firmware/red de tu proveedor.

---

## 6. Limitaciones conocidas (léelas antes de desplegar)

1. **No hay proveedor de correo.** El registro de cuentas de **empresa** (que requiere activación) y la
   **recuperación de contraseña** generan un token, pero el adaptador de correo (`console-email.adapter.ts`)
   solo lo imprime en la consola del servidor en desarrollo, y **con `NODE_ENV=production` no imprime nada**.
   Hasta que se integre un proveedor real (SMTP, SendGrid…), el administrador tiene estos atajos:
   - *Activar una cuenta de empresa:* en *Gestión → Usuarios* pulsa **Suspender** y luego **Reactivar** sobre
     esa cuenta (queda `Activo`), o llama a `PATCH /api/admin/usuarios/:id/reactivar`.
   - *Recuperar una contraseña:* leer el token en la base y pasarle el enlace `/m01-cuentas/restablecer?token=…`
     al usuario (válido 15 min):
     `SELECT token FROM "TokenAccion" WHERE tipo = 'RecuperacionContrasena' AND usado = false ORDER BY expiracion DESC LIMIT 1;`
     (con Docker: `docker exec -it hampiyura-db psql -U postgres -d hampiyura -c "<la consulta>"`)
   - Las cuentas **personales** no necesitan activación: quedan activas al registrarse.
2. **Mapas y geocodificación** usan servicios públicos gratuitos y sin clave: teselas de
   [OpenTopoMap](https://opentopomap.org) y búsqueda/geocodificación inversa de
   [Nominatim](https://nominatim.org) (política de uso razonable, ~1 petición/seg). Para tráfico alto,
   configura un proveedor propio en `hampiyura-web/src/modules/m03-cultivo/`.
3. **Fotografías de las plantas base y de la portada** se cargan desde Wikimedia Commons (enlace directo).
   Si quieres independencia, descárgalas a `hampiyura-web/public/` y actualiza
   `src/modules/m02-catalogo-plantas/components/imagen-planta.ts` y `src/styles/tokens.css`.
4. **Sesión:** el token dura **1 día**; al vencer, la app pide iniciar sesión de nuevo.
5. **CORS** está abierto (`cors()`); no es un problema con el proxy de nginx (mismo origen), pero restríngelo si
   expones la API directamente.

---

## 7. Pruebas

```bash
cd hampiyura-api
npm test          # 192 pruebas unitarias de casos de uso (no necesitan base de datos)
cd ../hampiyura-web
npx tsc -b        # verificación de tipos del frontend
```

---

## 8. Solución de problemas

| Síntoma | Causa / solución |
|---|---|
| `JWT_SECRET no está definido, es un valor de ejemplo…` al arrancar | Estás con `NODE_ENV=production` sin un secreto real. Genera uno: `openssl rand -hex 32`. |
| `Can't reach database server` / `P1001` | Postgres no está levantado o `DATABASE_URL` es incorrecta. Con Docker: `docker compose up -d db` y `docker compose ps`. |
| `EPERM … query_engine-windows.dll.node` (Windows) | Otro proceso de Node tiene abierto el motor de Prisma. Detén el backend (`npm run dev`) y repite `npx prisma generate`. |
| La app carga pero todo da 404 en `/api` | En producción falta el proxy: revisa la configuración de nginx (sección 5.2). |
| "Autenticación requerida" / "Tu sesión expiró" | La sesión venció (dura 1 día): vuelve a iniciar sesión. |
| Las fotos subidas desaparecen tras un despliegue | La carpeta `hampiyura-api/uploads/` no persiste entre despliegues: móntala como volumen o respáldala. |
| El buscador del header no aparece | Es intencional por debajo de 1600 px de ancho: se usa el menú hamburguesa (☰), que contiene lo mismo. |

---

## 9. Estructura

```
Hampiyura/
├─ hampiyura-api/          Backend (src/domain · application · infrastructure — arquitectura hexagonal)
│  ├─ prisma/              schema.prisma, migraciones y seed.ts
│  └─ uploads/             fotos subidas (no versionadas)
├─ hampiyura-web/          Frontend (src/modules/mXX-… por módulo, src/shared, src/styles)
├─ deploy/                 unidad systemd, alternativa pm2, nginx y script de actualización
├─ docker-compose.yml      PostgreSQL
└─ docs/                   Arquitectura hexagonal, requisitos, actas de entrevistas
```
