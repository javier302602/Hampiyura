import { apiRequest } from '../../../shared/api/client';

// RF-251, criterio de aceptación: si la ficha no está validada, el backend no expone ningún dato
// agronómico -- solo el estado y un mensaje. `id`/`plantaId` sí llegan siempre (se necesitan para
// poder registrar una ubicación aunque la ficha todavía no esté validada).
export type FichaCultivoVisible =
  | { disponible: true; id: string; plantaId: string; zonaCultivo: string; metodoPropagacion: string; estadoValidacion: string }
  | { disponible: false; id: string; plantaId: string; estadoValidacion: string; mensaje: string };

export function listarFichasPorPlanta(plantaId: string): Promise<FichaCultivoVisible[]> {
  return apiRequest<FichaCultivoVisible[]>(`/plantas/${plantaId}/cultivos`);
}
