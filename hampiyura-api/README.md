# HampiYura API

Backend Node.js + TypeScript (Express 5, Prisma, PostgreSQL) con arquitectura hexagonal:
`src/domain` (entidades, puertos, reglas), `src/application` (casos de uso por módulo M-01…M-14) y
`src/infrastructure` (HTTP, Prisma, almacenamiento, correo).

| Comando | Qué hace |
|---|---|
| `npm ci` | Instala dependencias |
| `npx prisma migrate deploy` (`npm run migrate:deploy`) | Aplica las migraciones a la base de datos |
| `npm run seed` | Carga 25 usos, 3 plantas base y (opcional) el administrador inicial |
| `npm run dev` | Servidor en desarrollo con recarga (`tsx watch`) |
| `npm run build` | `prisma generate` + compilación a `dist/` |
| `npm start` | Ejecuta `dist/main.js` (producción) |
| `npm test` | Pruebas unitarias (Jest) |

Configuración: copia `.env.example` a `.env`. Instrucciones completas de instalación, variables de entorno,
despliegue en producción y limitaciones conocidas en el [README de la raíz](../README.md).
