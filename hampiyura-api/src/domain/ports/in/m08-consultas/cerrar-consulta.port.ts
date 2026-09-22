import { Consulta } from '../../../entities/consulta.entity';
// Cierre manual (además del cierre automático por inactividad -- ver
// Consulta.cerrarPorInactividadSiCorresponde, aplicado de forma perezosa en cargarConAcceso/las
// listas). Mismo control de acceso que ObtenerConsultaPort.
export interface CerrarConsultaPort { ejecutar(id: string, solicitanteId: string, rolSolicitante: string): Promise<Consulta>; }
