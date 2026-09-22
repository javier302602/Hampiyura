import { EstadoSeguimientoAccion } from '../value-objects/estado-seguimiento-accion.vo';

// RF-268: registro de una actividad (ej. campaña de reforestación) -- vincula directamente a una
// Planta, no a un EstadoConservacion. No es una afirmación científica como RF-267, así que no
// exige Fuente ni pasa por el flujo de validación de M-09 (se publica de inmediato).
export interface AccionConservacionProps {
  id: string;
  plantaId: string;
  autorId: string;
  descripcion: string;
  responsable: string;
  evidencias: string;
  estadoSeguimiento: EstadoSeguimientoAccion;
  fecha: Date;
}
export class AccionConservacion { constructor(public readonly props: AccionConservacionProps) {} }
