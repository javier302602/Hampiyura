# HampiYura Web

SPA en React 19 + TypeScript + Vite, organizada por módulo (`src/modules/mXX-…`), con un sistema de diseño
propio en `src/shared/ui` y tokens de color/tema en `src/styles/tokens.css` (modo claro/oscuro con
alternador manual).

| Comando | Qué hace |
|---|---|
| `npm ci` | Instala dependencias |
| `npm run dev` | Servidor de desarrollo en <http://localhost:5173> (reenvía `/api` y `/uploads` a `localhost:3000`) |
| `npm run build` | Verifica tipos y genera el sitio estático en `dist/` |

No usa variables de entorno: llama a `/api` en el mismo dominio. En producción, sirve `dist/` con nginx y
reenvía `/api` y `/uploads` al backend (ver [`deploy/nginx.conf.example`](../deploy/nginx.conf.example)).
Instrucciones completas en el [README de la raíz](../README.md).
