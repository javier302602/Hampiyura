// Vista pública del mapa de distribución (RF-271). `latitud`/`longitud` llegan en null cuando la
// planta está actualmente en riesgo (RN-07) -- incluso si la ubicación fue guardada con
// coordenadas ANTES de que la planta se marcara en riesgo, aquí se ocultan igual (defensa en
// profundidad: nunca se EXPONEN, sin importar lo que haya quedado guardado).
export interface UbicacionCultivoVisible {
  id: string;
  cultivoId: string;
  plantaId: string;
  nombreComunPlanta: string;
  // Familia botánica de la planta (único campo de "categoría" que ya existe en Planta -- no hay
  // un campo "categoría"/"uso" dedicado; "uso" vive en M-04 como una relación aparte vía ParteUso,
  // no un campo de Planta/Cultivo, así que no se une aquí para no inventar un cruce nuevo).
  familia: string;
  tipoCultivo: string;
  zona: string;
  latitud: number | null;
  longitud: number | null;
  fecha: Date;
  // Igual que `autorNombre` en PublicacionVisible: nombre público de quien registró la ubicación,
  // con el mismo fallback al id si el usuario ya no existe.
  autorNombre: string;
}
export interface ListarMapaCultivoPort { ejecutar(): Promise<UbicacionCultivoVisible[]>; }
