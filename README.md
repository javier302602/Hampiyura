# HampiYura

Plataforma web de plantas medicinales amazónicas: catálogo con fotografías y usos, mapa de cultivos con
relieve, publicaciones y consultas a especialistas, directorio de productos de emprendedores y un flujo
de validación por especialistas para todo lo que la comunidad propone.

| Parte | Carpeta | Tecnología |
|---|---|---|
| Backend (API REST) | [`hampiyura-api/`](hampiyura-api) | Node.js + TypeScript, Express 5, Prisma, PostgreSQL, arquitectura hexagonal |
| Frontend (SPA) | [`hampiyura-web/`](hampiyura-web) | React 19 + TypeScript + Vite, React Router, Leaflet |
| Base de datos | [`docker-compose.yml`](docker-compose.yml) | PostgreSQL 16 (opcional vía Docker) |
| Ejemplo de nginx | [`deploy/nginx.conf.example`](deploy/nginx.conf.example) | Servir el frontend y reenviar `/api` |
| Documentación de diseño | [`docs/`](docs) | Arquitectura, requisitos, actas |

---

## 1. Requisitos

| Herramienta | Versión | Notas |
|---|---|---|
| **Node.js** | **20 o superior** (probado con 22 LTS) | incluye `npm` |
| **PostgreSQL** | 14 o superior (probado con 16) | o Docker, ver más abajo |
| **git** | cualquiera | |
| Docker + Docker Compose | opcional | solo para levantar la base de datos sin instalar Postgres |

En Linux, Prisma necesita `openssl` instalado (`apt install openssl`). El paquete `bcrypt` trae binarios
precompilados; si tu sistema no los tiene y tiene que compilar, instala `build-essential` y `python3`.

---

## 2. Puesta en marcha en desarrollo (paso a paso, desde cero)

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

## 5. Despliegue en producción

Arquitectura recomendada: **nginx** sirve el frontend compilado (archivos estáticos) y reenvía `/api` y
`/uploads` al backend Node, que habla con PostgreSQL.

### 5.1 Backend

```bash
cd hampiyura-api
cp .env.example .env
#   Edita .env: DATABASE_URL real, JWT_SECRET (openssl rand -hex 32), NODE_ENV=production
npm ci                      # instala también las devDependencies: `prisma` y `tsx` se usan en migrate/seed/build
npm run migrate:deploy      # aplica migraciones
npm run seed                # (con SEED_ADMIN_* la primera vez)
npm run build               # prisma generate + tsc  ->  dist/
NODE_ENV=production npm start   # node dist/main.js  (puerto PORT, 3000 por defecto)
```

Importante:

- Ejecuta el backend **desde la carpeta `hampiyura-api/`**: las fotos subidas se guardan en `./uploads`
  (ruta relativa al directorio de trabajo). Esa carpeta debe **persistir** y entrar en tus copias de seguridad.
- Mantén el proceso vivo con un gestor: por ejemplo `pm2 start dist/main.js --name hampiyura-api`
  (con `NODE_ENV=production` y las variables del `.env`), o una unidad `systemd`.

### 5.2 Frontend

```bash
cd hampiyura-web
npm ci
npm run build               # tsc -b && vite build  ->  dist/
```

Copia el contenido de `hampiyura-web/dist/` a la carpeta que sirve nginx (p. ej. `/var/www/hampiyura`) y usa
[`deploy/nginx.conf.example`](deploy/nginx.conf.example): sirve la SPA con *fallback* a `index.html`
(React Router) y reenvía `/api/` y `/uploads/` a `http://127.0.0.1:3000`.
Añade HTTPS con [certbot](https://certbot.eff.org).

> `npm run preview` **no** sirve para producción y no reenvía `/api`. Usa nginx (o cualquier servidor
> estático con proxy inverso).

### 5.3 Checklist de seguridad antes de exponerlo

- [ ] `NODE_ENV=production` y un `JWT_SECRET` propio (≥ 32 caracteres).
- [ ] Contraseña de Postgres distinta de `postgres`; el puerto 5432 **no** expuesto a internet
      (el `docker-compose.yml` ya lo enlaza solo a `127.0.0.1`).
- [ ] HTTPS activo.
- [ ] Copias de seguridad periódicas de la base de datos **y** de `hampiyura-api/uploads/`.
- [ ] Quita `SEED_ADMIN_PASSWORD` del `.env` tras el primer seed y cambia la clave del admin.
- El backend no incluye *rate limiting* ni `helmet`; si lo expones a mucho tráfico, ponlos delante (nginx `limit_req`) o añádelos.

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
├─ deploy/nginx.conf.example
├─ docker-compose.yml      PostgreSQL
└─ docs/                   Arquitectura hexagonal, requisitos, actas de entrevistas
```
