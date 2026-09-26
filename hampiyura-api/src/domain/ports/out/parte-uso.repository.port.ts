import { ParteUso } from '../../entities/parte-uso.entity';
import { EstadoValidacion } from '../../value-objects/estado-validacion.vo';
export interface ParteUsoRepositoryPort {
  guardar(parteUso: ParteUso): Promise<void>;
  buscarPorId(id: string): Promise<ParteUso | null>;
  listarPorPlanta(plantaId: string): Promise<ParteUso[]>;
  // M-12/RF-110/RF-153: "categoría"/"propiedad medicinal" = el catálogo Uso de M-04 (RF-256).
  // Para buscar "plantas que tengan esta propiedad" se necesita ir de usoId -> plantas.
  listarPorUso(usoId: string): Promise<ParteUso[]>;
  actualizarEstadoValidacion(id: string, estado: EstadoValidacion): Promise<void>;
  // Seguimiento científico: persiste contactoSeguimiento, tipoConocimiento y la evidencia registrada.
  actualizar(parteUso: ParteUso): Promise<void>;
  listar(): Promise<ParteUso[]>;
}
