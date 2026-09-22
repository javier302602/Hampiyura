import { UbicacionCultivo } from '../../entities/ubicacion-cultivo.entity';

/** RF-271: activado -- ver docs/arquitectura/HAMPIYURA_Arquitectura_Hexagonal.md (CG-001).
 * `obtenerUbicacion` conserva la firma ya declarada (una ubicación por cultivo: la más reciente
 * registrada para esa ficha); se agregan `guardar` y `listarTodas`, necesarias para registrar
 * y para alimentar el mapa público, sin las cuales el puerto no podía activarse. */
export interface MapaCultivoPort {
  guardar(ubicacion: UbicacionCultivo): Promise<void>;
  obtenerUbicacion(cultivoId: string): Promise<UbicacionCultivo | null>;
  listarTodas(): Promise<UbicacionCultivo[]>;
}
