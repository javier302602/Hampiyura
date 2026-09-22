// Geocodificación vía Nominatim (OpenStreetMap) -- el mismo proveedor de los tiles que ya usa el
// mapa, así que no se agrega una dependencia/cuenta nueva. IMPORTANTE: la instancia pública
// (nominatim.openstreetmap.org) es gratuita pero de uso limitado (≈1 solicitud/segundo, sin SLA,
// pensada para tráfico bajo/demos) -- ver https://operations.osmfoundation.org/policies/nominatim/.
// Esto es apropiado para esta demo/hackathon, pero si el producto escala a tráfico real, esto debe
// migrarse a un proveedor con cuota propia (Mapbox, Google Geocoding, LocationIQ, etc.) o a una
// instancia propia de Nominatim -- no dejar esto como la solución final de producción.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface SugerenciaLocalidad {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
}

export async function buscarLocalidad(consulta: string, signal?: AbortSignal): Promise<SugerenciaLocalidad[]> {
  const texto = consulta.trim();
  if (texto.length < 3) return [];
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: texto,
    limit: '5',
    // Acotado a Perú: HAMPIYURA es sobre plantas de la Amazonía peruana, así que restringir aquí
    // reduce ruido de resultados sin inventar ningún filtro fuera de lo que el propio producto ya asume.
    countrycodes: 'pe',
  });
  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error('No se pudo buscar la localidad.');
  const datos = await response.json();
  return (datos as Array<{ place_id: number; display_name: string; lat: string; lon: string }>).map((d) => ({
    id: String(d.place_id),
    nombre: d.display_name,
    latitud: Number(d.lat),
    longitud: Number(d.lon),
  }));
}
