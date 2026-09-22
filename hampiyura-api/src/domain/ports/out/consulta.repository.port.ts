import { Consulta } from '../../entities/consulta.entity';
import { TipoConsulta } from '../../value-objects/tipo-consulta.vo';
import { EstadoConsulta } from '../../value-objects/estado-consulta.vo';
import { AreaEspecialidad } from '../../value-objects/area-especialidad.vo';

export interface FiltrosBandejaConsultas { tipo?: TipoConsulta; estado?: EstadoConsulta; area?: AreaEspecialidad; }

export interface ConsultaRepositoryPort {
  guardar(consulta: Consulta): Promise<void>;
  buscarPorId(id: string): Promise<Consulta | null>;
  actualizar(consulta: Consulta): Promise<void>;
  // RF-264: bandeja del equipo, filtrable por tipo/estado/área.
  listar(filtros: FiltrosBandejaConsultas): Promise<Consulta[]>;
  // RF-263: historial propio del usuario autenticado.
  listarPorAutor(autorId: string): Promise<Consulta[]>;
}
