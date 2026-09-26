import { apiRequest } from '../../../shared/api/client';

// RF-251, criterio de aceptación: si la ficha no está validada, el backend no expone ningún dato
// agronómico -- solo el estado y un mensaje. `id`/`plantaId` sí llegan siempre (se necesitan para
// poder registrar una ubicación aunque la ficha todavía no esté validada).
// Guía de cultivo (la redacta un especialista en agronomía): null = pendiente, nunca se rellena por el sistema.
export interface GuiaCultivo { campos: Record<string, string | null>; completada: number; total: number; actualizadaEn: string | null }
export type FichaCultivoVisible =
  | { disponible: true; id: string; plantaId: string; zonaCultivo: string; metodoPropagacion: string; estadoValidacion: string; guia: GuiaCultivo }
  | { disponible: false; id: string; plantaId: string; estadoValidacion: string; mensaje: string; guia: GuiaCultivo };

export function listarFichasPorPlanta(plantaId: string): Promise<FichaCultivoVisible[]> {
  return apiRequest<FichaCultivoVisible[]>(`/plantas/${plantaId}/cultivos`);
}

// Guía de cultivo: solo Especialista en agronomía o Administrador (el servidor lo exige).
export async function actualizarGuiaCultivo(id: string, input: Record<string, string>): Promise<GuiaCultivo> {
  const ficha = await apiRequest<FichaCultivoVisible>(`/cultivos/${encodeURIComponent(id)}/guia`, { method: 'PATCH', body: JSON.stringify(input) });
  return ficha.guia;
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
