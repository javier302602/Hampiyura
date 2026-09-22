import { ValidacionContenido } from '../../../entities/validacion-contenido.entity';

// RNF-304 (auditoría básica): reusa el historial que ya deja ValidacionContenido -- no es una
// tabla nueva. Solo decisiones ya tomadas (Validado/Observado/Rechazado); la cola de pendientes
// ya se expone en GET /api/validaciones/pendientes.
export type RegistroAuditoria = ValidacionContenido['props'];
export interface ObtenerAuditoriaPort { ejecutar(): Promise<RegistroAuditoria[]>; }
