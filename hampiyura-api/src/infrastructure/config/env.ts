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

// Datos de cobro (M-15): a dónde se envía el Yape/Plin. Si no se configuran, la interfaz lo dice ("por
// configurar") en vez de mostrar un número inventado.
function cobro(nombre: 'YAPE' | 'PLIN') {
  const numero = process.env[`PAGO_${nombre}_NUMERO`]?.trim();
  return numero ? { numero, titular: process.env[`PAGO_${nombre}_TITULAR`]?.trim() || 'HampiYura' } : null;
}
// Asistente de IA (Ronda 27). ASISTENTE_ACTIVO=false lo apaga por completo (el endpoint responde "no disponible") sin tocar código.
// Sin ASISTENTE_API_KEY funciona en MODO SIMULADO (respuestas armadas solo con lo validado, marcadas "[Modo simulado]"): no llama a
// ningún proveedor ni cuesta nada. La clave real va SOLO en el entorno, nunca en el repositorio.
function entero(nombre: string, porDefecto: number) { const n = Number(process.env[nombre]); return Number.isFinite(n) && n > 0 ? Math.floor(n) : porDefecto; }
const asistente = {
  activo: (process.env.ASISTENTE_ACTIVO ?? 'true').trim().toLowerCase() !== 'false',
  apiKey: process.env.ASISTENTE_API_KEY?.trim() || null,
  modelo: process.env.ASISTENTE_MODELO?.trim() || 'claude-haiku-4-5-20251001',
  limitePorMinuto: entero('ASISTENTE_LIMITE_POR_MINUTO', 6),
  limitePorDia: entero('ASISTENTE_LIMITE_POR_DIA', 60),
};
export const env = { port: Number(process.env.PORT ?? 3000), jwtSecret: leerJwtSecret(), cobro: { yape: cobro('YAPE'), plin: cobro('PLIN') }, asistente };
