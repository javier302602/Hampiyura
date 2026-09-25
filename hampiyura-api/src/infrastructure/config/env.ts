import 'dotenv/config';

// Valores que NUNCA deben firmar tokens en un servidor real: el repositorio es público, así que
// cualquiera que los conozca podría forjar un JWT (incluido uno de Administrador).
const SECRETOS_DE_EJEMPLO = ['replace-with-a-local-secret', 'development-only-secret', 'changeme', 'secret'];

// En desarrollo/tests se tolera la ausencia de JWT_SECRET (fallback local). En producción
// (NODE_ENV=production) el servidor se niega a arrancar sin un secreto real -- antes caía en
// silencio a 'development-only-secret', que está escrito en el código fuente.
function leerJwtSecret(): string {
  const valor = process.env.JWT_SECRET;
  const produccion = process.env.NODE_ENV === 'production';
  const esEjemplo = !valor || SECRETOS_DE_EJEMPLO.includes(valor);
  if (produccion && (esEjemplo || valor!.length < 32)) {
    throw new Error(
      'JWT_SECRET no está definido, es un valor de ejemplo o tiene menos de 32 caracteres. ' +
      'En producción debe ser un secreto aleatorio propio, p. ej.: openssl rand -hex 32',
    );
  }
  return esEjemplo ? 'development-only-secret' : valor!;
}

export const env = { port: Number(process.env.PORT ?? 3000), jwtSecret: leerJwtSecret() };
