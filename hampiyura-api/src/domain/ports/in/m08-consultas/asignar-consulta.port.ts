import { Consulta } from '../../../entities/consulta.entity';
// Asignación manual (solo Administrador; un especialista no se autoasigna -- ver
// AsignarConsultaUseCase). `especialistaId` debe ser un usuario del equipo (Administrador o
// Especialista_*), verificado contra UsuarioRepositoryPort antes de asignar.
export interface AsignarConsultaPort { ejecutar(id: string, especialistaId: string, solicitanteId: string, rolSolicitante: string): Promise<Consulta>; }
