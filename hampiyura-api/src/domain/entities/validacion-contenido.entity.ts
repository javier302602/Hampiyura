import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { UnauthorizedError, ValidationError } from '../errors/domain.errors';

// FASE 7 / auditoría (RNF-304): antes, `aprobar()` guardaba el id del validador metido dentro de
// `comentarioValidador`, y `observar()`/`rechazar()` ni siquiera lo guardaban (solo el parámetro
// `validadorId` se usaba para el chequeo de rol y se descartaba). Sin un campo propio, no había
// forma confiable de auditar "quién tomó esta decisión" para observaciones/rechazos. Se agrega
// `validadorId` dedicado en los 3 casos; `comentarioValidador` sigue siendo solo el texto de la
// justificación (obligatorio en observar/rechazar, no usado en aprobar).
// RN-05: un especialista solo valida contenido de su propia área -- antes `validarRol` aceptaba
// cualquier rol que empezara con "Especialista" para cualquier `tipoEntidad`, sin distinguir área
// (la restricción nunca se implementó de verdad). El área requerida se deriva del `tipoEntidad` ya
// guardado en el propio registro, usando los 3 roles de área que ya existen en Rol (rol.vo.ts) --
// deliberadamente NO se reutiliza `AreaEspecialidad` de M-08 (enum aislado a ese módulo, con su
// propia cuarta área "PlantasMedicinales" sin rol equivalente; decisión confirmada con el usuario).
// Cultivo->Agronomo y EstadoConservacion->Conservacion son mapeos directos de módulo. Preparacion y
// ParteUso->Salud porque ambos son, en el modelo actual, siempre conocimiento medicinal (RF-255:
// ParteUso nunca se presenta como algo distinto; Uso no tiene categoría propia para diferenciar
// "medicinal" de cualquier otro uso). Publicacion (contenido comunitario libre) y Producto (listado
// comercial) no tienen ninguna categorización de área hoy -- hasta que se les agregue una, solo
// Administrador puede validarlos, no "cualquier especialista" como con el chequeo anterior.
const ROL_REQUERIDO_POR_TIPO_ENTIDAD: Partial<Record<string, string>> = {
  Cultivo: 'EspecialistaAgronomo',
  EstadoConservacion: 'EspecialistaConservacion',
  Preparacion: 'EspecialistaSalud',
  ParteUso: 'EspecialistaSalud',
};

export interface ValidacionContenidoProps { id:string; tipoEntidad:string; entidadId:string; estado:EstadoValidacion; comentarioValidador?:string; fecha:Date; autorId:string; validadorId?:string; }
export class ValidacionContenido {
  constructor(public readonly props: ValidacionContenidoProps) {}
  private validarRol(rol: string) {
    if (rol !== 'Administrador' && !rol.startsWith('Especialista')) throw new UnauthorizedError('Solo especialistas o administradores pueden validar contenido');
    if (rol === 'Administrador') return;
    const rolRequerido = ROL_REQUERIDO_POR_TIPO_ENTIDAD[this.props.tipoEntidad];
    if (!rolRequerido) throw new UnauthorizedError(`Contenido de tipo "${this.props.tipoEntidad}" todavía no tiene un área asignada: solo un administrador puede validarlo`);
    if (rol !== rolRequerido) throw new UnauthorizedError(`Este contenido requiere un especialista de otra área (se necesita ${rolRequerido})`);
  }
  aprobar(validadorId:string, rol='Administrador') { this.validarRol(rol); this.props.estado='Validado'; this.props.validadorId=validadorId; this.props.fecha=new Date(); }
  observar(validadorId:string, comentario:string, rol='Administrador') { this.validarRol(rol); if (!comentario.trim()) throw new ValidationError('La observación es obligatoria'); this.props.estado='Observado'; this.props.comentarioValidador=comentario; this.props.validadorId=validadorId; this.props.fecha=new Date(); }
  rechazar(validadorId:string, comentario:string, rol='Administrador') { this.validarRol(rol); if (!comentario.trim()) throw new ValidationError('El motivo de rechazo es obligatorio'); this.props.estado='Rechazado'; this.props.comentarioValidador=comentario; this.props.validadorId=validadorId; this.props.fecha=new Date(); }
}
