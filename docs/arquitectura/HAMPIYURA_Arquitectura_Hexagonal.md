# HAMPIYURA — Arquitectura hexagonal (con código base ya generado y verificado)

Esta es la versión 2: ya no es solo el árbol de carpetas descrito, es **código real, generado y verificado** (`npm install`, `tsc --noEmit` sin errores, y las pruebas unitarias del módulo de ejemplo pasando). Va adjunto como `HAMPIYURA_Arquitectura_Codigo.zip`. Stack: **Node.js + TypeScript** en el backend, **React** en el frontend, **PostgreSQL** como base de datos.

**Sobre el mapa de cultivo:** tenías razón, faltaba. Lo agregué como una extensión declarada pero **no implementada todavía** (tal como dijiste, "a futuro"): en el diagrama aparece la clase `UbicacionCultivo` conectada a `Cultivo` con una relación punteada "mapeo geográfico futuro (pendiente, RF-271)", y en el código hay un puerto ya definido (`domain/ports/out/mapa-cultivo.port.ts`) sin ninguna implementación — así, cuando decidan abordarlo, no hay que reestructurar nada, solo llenar esa pieza.

---

## 1. Diagrama de clases general (dominio)

Archivo: `d6_dominio_hexagonal.png` (adjunto). Parte del diagrama que ya tenías (`d2_clases.mmd`) y lo amplía con las entidades que faltaban de los 6 módulos nuevos, para que el dominio quede completo antes de mapear las carpetas:

- **Cultivo** (M-03) — ficha agronómica de una planta (zona, clima, suelo, propagación, cosecha, fuente, estado de validación).
- **ParteUso** (M-04) — ahora con `contraindicaciones`, `fuente` y `estadoValidacion` explícitos.
- **Preparacion** (M-05) — con `ingredientes`, `autor`, `localidad`, `advertencias`, `fuente`, `estadoValidacion`.
- **Consulta** + **MensajeConsulta** (M-08) — la consulta ya no es un campo de texto suelto, es una entidad con su propio hilo de mensajes.
- **EstadoConservacion** + **AccionConservacion** (M-10) — separé el estado (categoría, riesgo, fuente) de las acciones de conservación que se registran sobre él.
- **Producto** (M-11) — con las tres etiquetas independientes que pide el RF-274 (`etiquetaRevisado`, `etiquetaValidadoDocumental`, `etiquetaCertificado`) en vez de un solo campo genérico.

Esta es la base que uso para decidir qué carpeta/entidad va en cada módulo de la arquitectura.

---

## 2. La idea de la arquitectura hexagonal aquí

Igual que en tu proyecto de Arquitectura de Software (`BackupsSolution`, ports & adapters en .NET), la regla es: **el dominio no conoce nada de afuera**. Ni Express, ni Prisma, ni PostgreSQL, ni S3. Solo conoce sus entidades y los "puertos" (interfaces) que necesita.

Tres capas, siempre en esta dirección de dependencia (nunca al revés):

```
infrastructure  →  application  →  domain
   (adapters)        (casos de uso)   (entidades, puertos)
```

- **`domain/`** — entidades, value objects, y los **puertos**: interfaces que declaran lo que el dominio necesita del exterior (`out`, ej. un repositorio) y lo que el dominio ofrece hacia afuera (`in`, ej. "aprobar contenido"). Cero dependencias externas — se podría copiar esta carpeta a otro proyecto sin tocar nada.
- **`application/`** — los casos de uso concretos (uno por cada RF *Must* relevante), que implementan los puertos `in` orquestando entidades del dominio a través de los puertos `out`. Tampoco sabe si el repositorio es Prisma, un mock o un archivo JSON.
- **`infrastructure/`** — los **adaptadores**: lo que sí sabe de Express, Prisma, S3, email, etc. Implementa los puertos `out` (repositorios reales) y expone los puertos `in` hacia afuera (controladores HTTP que llaman a un caso de uso).

Esto es lo que te permitió en `BackupsSolution` mockear `IFtpUploader` y probar sin FTP real — aquí es el mismo patrón: pruebas unitarias de dominio/aplicación con los puertos mockeados, y pruebas de integración solo para los adaptadores reales.

**Decisión de diseño clave:** en vez de duplicar el hexágono completo 14 veces (uno por módulo), organizo domain/application/infrastructure **una sola vez**, y dentro de cada capa agrupo por módulo (M-01…M-14). Duplicar el hexágono por módulo es más "puro" pero es mucho boilerplate para 8 semanas de hackathon (riesgo R-04 del SDS: sobredimensionar el alcance). Si más adelante el proyecto crece y algún módulo necesita independizarse (ej. a un microservicio), ya está agrupado y es fácil de extraer.

---

## 3. Backend — `hampiyura-api/`

```
hampiyura-api/
├── src/
│   ├── domain/                              # núcleo — sin dependencias externas
│   │   ├── entities/
│   │   │   ├── usuario.entity.ts
│   │   │   ├── planta.entity.ts
│   │   │   ├── cultivo.entity.ts                  # M-03
│   │   │   ├── parte-uso.entity.ts                # M-04
│   │   │   ├── preparacion.entity.ts              # M-05
│   │   │   ├── publicacion.entity.ts              # M-06
│   │   │   ├── comentario.entity.ts               # M-07
│   │   │   ├── valoracion.entity.ts               # M-07
│   │   │   ├── consulta.entity.ts                 # M-08
│   │   │   ├── mensaje-consulta.entity.ts         # M-08
│   │   │   ├── validacion-contenido.entity.ts     # M-09
│   │   │   ├── reporte.entity.ts                  # M-09
│   │   │   ├── estado-conservacion.entity.ts      # M-10
│   │   │   ├── accion-conservacion.entity.ts      # M-10
│   │   │   ├── producto.entity.ts                 # M-11
│   │   │   └── notificacion.entity.ts             # M-14
│   │   ├── value-objects/
│   │   │   ├── tipo-conocimiento.vo.ts            # Tradicional | Documentado | Científico | Pendiente
│   │   │   ├── estado-validacion.vo.ts            # Pendiente | EnRevision | Validado | Observado | Rechazado
│   │   │   ├── fuente.vo.ts                       # obligatorio en M-03 y M-10 (RF-251, RF-267)
│   │   │   └── rol.vo.ts                          # Visitante | UsuarioRegistrado | PortadorConocimiento | EspecialistaAgronomo | EspecialistaConservacion | EspecialistaSalud | Productor | Administrador
│   │   ├── ports/
│   │   │   ├── in/                                # casos de uso que el dominio expone (driving ports)
│   │   │   │   ├── m01-cuentas/
│   │   │   │   ├── m03-cultivo/registrar-ficha-cultivo.port.ts
│   │   │   │   ├── m08-comunicacion/enviar-consulta.port.ts
│   │   │   │   ├── m09-validacion/aprobar-contenido.port.ts
│   │   │   │   ├── m09-validacion/observar-contenido.port.ts
│   │   │   │   ├── m09-validacion/rechazar-contenido.port.ts
│   │   │   │   ├── m10-conservacion/registrar-estado-conservacion.port.ts
│   │   │   │   ├── m11-productos/publicar-producto.port.ts
│   │   │   │   └── ...  (uno por cada RF Must del módulo; los Should/Could se agregan cuando se implementan)
│   │   │   └── out/                               # lo que el dominio necesita del exterior (driven ports)
│   │   │       ├── usuario.repository.port.ts
│   │   │       ├── planta.repository.port.ts
│   │   │       ├── cultivo.repository.port.ts
│   │   │       ├── validacion-contenido.repository.port.ts
│   │   │       ├── consulta.repository.port.ts
│   │   │       ├── producto.repository.port.ts
│   │   │       ├── notificador.port.ts            # M-14 — envío de notificaciones
│   │   │       ├── almacenamiento-media.port.ts    # M-06 — subida de fotos/video
│   │   │       └── fuente-externa.port.ts          # M-10 — SERNANP/UICN/MINSA (pendiente de convenio, cap. 23)
│   │   └── errors/
│   │       └── domain.errors.ts
│   │
│   ├── application/                         # casos de uso — implementan los puertos "in"
│   │   ├── m01-cuentas/
│   │   ├── m02-catalogo-plantas/
│   │   ├── m03-cultivo/
│   │   │   └── registrar-ficha-cultivo.use-case.ts
│   │   ├── m04-usos-partes/
│   │   ├── m05-preparaciones/
│   │   ├── m06-publicaciones/
│   │   ├── m07-comunidad/
│   │   ├── m08-comunicacion-especialistas/
│   │   ├── m09-validacion-moderacion/
│   │   │   ├── aprobar-contenido.use-case.ts
│   │   │   ├── observar-contenido.use-case.ts
│   │   │   ├── rechazar-contenido.use-case.ts
│   │   │   └── reportar-publicacion.use-case.ts
│   │   ├── m10-conservacion/
│   │   ├── m11-productos-emprendimientos/
│   │   ├── m12-busqueda-recomendaciones/
│   │   ├── m13-analitica-estadisticas/
│   │   └── m14-seguridad-notificaciones/
│   │
│   ├── infrastructure/                      # adaptadores — todo lo "externo"
│   │   ├── adapters/
│   │   │   ├── in/                          # entran al sistema (driving adapters)
│   │   │   │   └── http/
│   │   │   │       ├── controllers/
│   │   │   │       │   ├── m01-cuentas.controller.ts
│   │   │   │       │   ├── m03-cultivo.controller.ts
│   │   │   │       │   ├── m09-validacion.controller.ts
│   │   │   │       │   └── ...  (uno por módulo)
│   │   │   │       ├── routes/
│   │   │   │       ├── dtos/                # request/response — nunca exponen la entidad de dominio directa
│   │   │   │       └── middlewares/         # auth, roles (M-01/M-14), validación de input (zod)
│   │   │   └── out/                         # salen del sistema (driven adapters)
│   │   │       ├── persistence/
│   │   │       │   └── prisma/
│   │   │       │       ├── schema.prisma
│   │   │       │       └── repositories/
│   │   │       │           ├── usuario.prisma-repository.ts
│   │   │       │           ├── planta.prisma-repository.ts
│   │   │       │           ├── validacion-contenido.prisma-repository.ts
│   │   │       │           └── ...  (una por cada puerto out de repositorio)
│   │   │       ├── storage/
│   │   │       │   └── s3-media.adapter.ts          # o almacenamiento local en dev
│   │   │       ├── notifications/
│   │   │       │   └── email-push.adapter.ts        # M-14
│   │   │       └── external-sources/
│   │   │           ├── sernanp.adapter.ts           # M-10 — stub, "pendiente de convenio" (cap. 23)
│   │   │           └── minsa.adapter.ts             # M-10 — stub, "pendiente de convenio" (cap. 23)
│   │   └── config/
│   │       ├── env.ts
│   │       ├── container.ts                 # inyección de dependencias — conecta cada puerto con su adaptador
│   │       └── database.ts
│   │
│   └── main.ts                              # composition root: arranca Express y conecta todo
│
├── test/
│   ├── unit/            # domain + application, con los puertos mockeados (igual que IFtpUploader en BackupsSolution)
│   ├── integration/     # adapters contra una DB de prueba real
│   └── e2e/              # flujo completo vía HTTP
├── prisma/               # (o dentro de infrastructure/adapters/out/persistence/prisma, según prefieras)
├── .env.example
├── package.json
└── tsconfig.json
```

### Ejemplo concreto de una porción vertical (M-09 · Validación)

Para que veas cómo encajan las piezas, este es el flujo de **RF-267 / aprobar contenido**, de punta a punta:

```ts
// domain/ports/out/validacion-contenido.repository.port.ts
export interface ValidacionContenidoRepositoryPort {
  buscarPorId(id: string): Promise<ValidacionContenido | null>;
  guardar(v: ValidacionContenido): Promise<void>;
}

// domain/ports/in/m09-validacion/aprobar-contenido.port.ts
export interface AprobarContenidoPort {
  ejecutar(input: { validacionId: string; validadorId: string }): Promise<void>;
}

// application/m09-validacion-moderacion/aprobar-contenido.use-case.ts
export class AprobarContenidoUseCase implements AprobarContenidoPort {
  constructor(
    private readonly repo: ValidacionContenidoRepositoryPort,
    private readonly notificador: NotificadorPort,
  ) {}
  async ejecutar({ validacionId, validadorId }) {
    const validacion = await this.repo.buscarPorId(validacionId);
    if (!validacion) throw new ValidacionNoEncontradaError(validacionId);
    validacion.aprobar(validadorId);           // regla de negocio vive en la entidad
    await this.repo.guardar(validacion);
    await this.notificador.notificar(validacion.autorId, 'contenido_aprobado');
  }
}

// infrastructure/adapters/out/persistence/prisma/validacion-contenido.prisma-repository.ts
export class PrismaValidacionContenidoRepository implements ValidacionContenidoRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}
  async buscarPorId(id: string) { /* ... prisma.validacionContenido.findUnique ... */ }
  async guardar(v: ValidacionContenido) { /* ... prisma.validacionContenido.update ... */ }
}

// infrastructure/adapters/in/http/controllers/m09-validacion.controller.ts
router.post('/validaciones/:id/aprobar', async (req, res) => {
  await aprobarContenidoUseCase.ejecutar({ validacionId: req.params.id, validadorId: req.user.id });
  res.status(204).send();
});
```

En pruebas unitarias, `AprobarContenidoUseCase` se prueba pasando un mock de `ValidacionContenidoRepositoryPort` y otro de `NotificadorPort` — sin tocar Prisma ni la base de datos real, igual que hiciste con `IFtpUploader`.

---

## 4. Frontend — `hampiyura-web/`

React no usa hexagonal en sentido estricto (no hay "dominio de negocio" en el cliente), así que aquí uso agrupación por módulo ("screaming architecture") en vez del patrón de puertos:

```
hampiyura-web/
├── src/
│   ├── modules/
│   │   ├── m01-cuentas/
│   │   ├── m02-catalogo-plantas/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/               # llamadas a la API del backend (adapter hacia afuera)
│   │   │   └── pages/
│   │   ├── m03-cultivo/
│   │   ├── m04-usos-partes/
│   │   ├── m05-preparaciones/
│   │   ├── m06-publicaciones/
│   │   ├── m07-comunidad/
│   │   ├── m08-comunicacion-especialistas/
│   │   ├── m09-validacion-moderacion/       # panel de admin/especialista
│   │   ├── m10-conservacion/
│   │   ├── m11-productos-emprendimientos/
│   │   ├── m12-busqueda-recomendaciones/
│   │   ├── m13-analitica-estadisticas/      # panel de administrador
│   │   └── m14-seguridad-notificaciones/
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/                    # cliente HTTP central (axios/fetch)
│   └── App.tsx
├── package.json
└── tsconfig.json
```

## 5. Repos y tipos compartidos

Recomendación: **monorepo con npm workspaces** (`hampiyura-api/` + `hampiyura-web/` + `packages/shared-types/`), para que los DTOs de la API y los tipos que consume React vivan en un solo lugar y no se desincronicen. Si prefieres repos separados (como en tus proyectos anteriores con GitHub), también funciona — solo hay que duplicar o publicar los tipos compartidos como paquete npm privado.

---

## 6. Siguiente paso

## 7. Lo que ya está armado y verificado en `HAMPIYURA_Arquitectura_Codigo.zip`

No es solo el árbol descrito arriba — es el código real, con `package.json`, `tsconfig.json`, `prisma/schema.prisma` (las 16 entidades del diagrama, incluyendo el comentario sobre `UbicacionCultivo` futuro), y las 95 archivos del backend + 23 del frontend ya en su carpeta correspondiente.

**Verificado en este entorno antes de mandártelo:**
- `npm install` corre limpio en `hampiyura-api/` y `hampiyura-web/`.
- `npx tsc --noEmit` — **0 errores** en todo el backend.
- `npx tsc -b` — **0 errores** en el frontend.
- `npx jest` — las 2 pruebas unitarias de `AprobarContenidoUseCase` (módulo M-09) pasan, mockeando los puertos igual que hiciste con `IFtpUploader` en `BackupsSolution`.

**Tres módulos implementados de punta a punta** (dominio → aplicación → infraestructura → ruta HTTP), para que tengas un ejemplo funcional real de cada tipo de flujo:
- `M-01 · Cuentas` — registro y login (con JWT y bcrypt).
- `M-03 · Cultivo` — registrar ficha de cultivo (RF-251, con `Fuente` obligatoria).
- `M-09 · Validación, Moderación y Trazabilidad` — aprobar/observar/rechazar contenido.

**Los otros 11 módulos** tienen su carpeta real ya creada (`application/<módulo>/README.md`, etc.) con instrucciones paso a paso de cómo completarlos siguiendo exactamente el mismo patrón — no fingí que ya estaban implementados, siguiendo el mismo criterio de "no inventar" que ya usamos en el SDS. La razón de no implementar los 14 de una es el riesgo R-04 que ya está en tu SDS (sobredimensionar el alcance para 8 semanas).

`prisma generate` no lo pude correr en este entorno (el sandbox bloquea la descarga del motor de Prisma desde `binaries.prisma.sh`), pero en tu máquina con internet normal va a funcionar sin problema — es el primer paso del `README.md` del backend.

## 8. Siguiente paso

Con esto ya tienes algo que puedes clonar y correr (`npm install`, levantar Postgres con `docker compose up -d`, `npx prisma migrate dev`, `npm run dev`). El siguiente paso es pasar el diagrama + la explicación de la arquitectura al documento formal, y de ahí armamos el plan de desarrollo (fases, qué de los 11 módulos pendientes se implementa primero según MoSCoW, y el roadmap de las 8 semanas del hackathon). Dime si quieres ajustar algo antes de seguir — por ejemplo si prefieres NestJS en vez de Express puro, o si el mapa de cultivo lo quieres priorizar antes de lo que pensábamos.
