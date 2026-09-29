// M-16 · Costo de envío REAL calculado por distancia (fórmula de Haversine entre las coordenadas del
// producto y las del punto de entrega que marca el comprador en el mapa) — no es un monto inventado.
// Tarifa fijada por el equipo: S/ ENVIO_BASE de base + S/ ENVIO_POR_KM por cada km.
//
// Por encima de ENVIO_LARGO_KM no existe ninguna base de datos real de "paraderos" que podamos consultar
// (y en las zonas rurales amazónicas que atiende esta plataforma, OpenStreetMap casi no tiene paraderos
// cargados): en vez de inventar uno con un mapa que no tiene esos datos ahí, se le pide al comprador un
// punto de referencia conocido y cercano para coordinar la entrega ahí (ver Pedido.entregaReferencia).
export const ENVIO_BASE = 5;
export const ENVIO_POR_KM = 0.5;
export const ENVIO_LARGO_KM = 15;

const redondear = (n: number) => Math.round(n * 100) / 100;

export function calcularDistanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (g: number) => (g * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return redondear(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
export function calcularCostoEnvio(distanciaKm: number): number { return redondear(ENVIO_BASE + ENVIO_POR_KM * distanciaKm); }
export function envioEsLargo(distanciaKm: number): boolean { return distanciaKm > ENVIO_LARGO_KM; }
