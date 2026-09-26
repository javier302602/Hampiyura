import { apiRequest } from '../../../shared/api/client';
import type { EstadoConservacionVisible } from '../../m10-conservacion/api/conservacion.api';

export interface Planta {
  id: string;
  nombreComun: string;
  nombreCientifico: string;
  familia: string;
  region: string;
  habitat: string;
  imagenPrincipal?: string;
  // Atribución de la foto (autor, licencia y página de origen).
  imagenAutor?: string;
  imagenLicencia?: string;
  imagenFuenteUrl?: string;
}

// GET /plantas/:id (ObtenerPlantaUseCase) enriquece la ficha con el resumen de conservación de
// M-10 en vez de duplicar el endpoint -- GET /plantas (listado) NO trae este campo.
export type PlantaVisible = Planta & { conservacion: EstadoConservacionVisible };

export function listarPlantas(): Promise<Planta[]> { return apiRequest<Planta[]>('/plantas'); }
export function obtenerPlanta(id: string): Promise<PlantaVisible> { return apiRequest<PlantaVisible>(`/plantas/${id}`); }

// Frente 4 (auditoría): "Proponer planta" -- cualquier usuario autenticado, queda "Pendiente"
// (no aparece en listarPlantas/obtenerPlanta hasta que un validador la apruebe en la bandeja de
// M-09, mismo criterio que Producto/Publicacion).
export interface ProponerPlantaInput {
  nombreComun: string;
  nombreCientifico: string;
  familia: string;
  region: string;
  habitat: string;
  imagenPrincipal?: string;
  // Ubicación de observación (GPS o mapa). Solo la ve quien valida; el catálogo público nunca la devuelve.
  latitud?: number;
  longitud?: number;
  // De 1 a 8 partes medicinales con su uso (RF-255); cada una es su propio registro y queda "Pendiente" en M-09.
  partesUso: {
    parte: string;
    parteDetalle?: string;
    usoId: string;
    motivoUso: string;
    tipoConocimiento: string;
    fuente: string;
    contraindicaciones?: string;
  }[];
}
export function proponerPlanta(input: ProponerPlantaInput): Promise<Planta> {
  return apiRequest<Planta>('/plantas/proponer', { method: 'POST', body: JSON.stringify(input) });
}
