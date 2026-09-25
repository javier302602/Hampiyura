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

// RF-251: solo Especialista/Administrador (POST /cultivos exige requireValidator). El autor se toma
// del token en el servidor; la ficha nace "Pendiente" y entra a la bandeja de validación (M-09).
export interface RegistrarFichaCultivoInput {
  plantaId: string; zonaCultivo: string; condicionesClimaticas: string; tipoSuelo: string; altitudAprox: string;
  aguaNecesaria: string; exposicionSolar: string; epocaSiembra: string; metodoPropagacion: string; tiempoCrecimiento: string;
  cuidados: string; plagasComunes: string; epocaCosecha: string; recomendacionesSobreexplotacion: string;
  consejosRecoleccion: string; mesesSiembra: number[]; mesesCosecha: number[]; fuente: string;
}
export interface FichaCultivoCreada { id: string; plantaId: string; zonaCultivo: string; estadoValidacion: string; }

export function registrarFichaCultivo(input: RegistrarFichaCultivoInput): Promise<FichaCultivoCreada> {
  return apiRequest<FichaCultivoCreada>('/cultivos', { method: 'POST', body: JSON.stringify(input) });
}
