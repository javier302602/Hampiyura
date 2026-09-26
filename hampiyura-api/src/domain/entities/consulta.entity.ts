import { TipoConsulta } from '../value-objects/tipo-consulta.vo';
import { EstadoConsulta } from '../value-objects/estado-consulta.vo';
import { PrioridadConsulta } from '../value-objects/prioridad-consulta.vo';
import { AreaEspecialidad } from '../value-objects/area-especialidad.vo';
import { ValidationError } from '../errors/domain.errors';

export interface ConsultaProps {
  id: string;
  // RF-263: un visitante sin cuenta puede enviar una consulta general -- sin autorId, no hay forma
  // de listarle "sus" consultas después. Es intencional (ver ListarMisConsultasUseCase), no un bug.
  autorId?: string;
  tipo: TipoConsulta;
  descripcion: string;
  estado: EstadoConsulta;
  // RN-06: se calcula automáticamente (ver calcularPrioridad), nunca la marca el usuario a mano.
  prioridad: PrioridadConsulta;
  areaAsignada?: AreaEspecialidad;
  // Referencia opcional a un administrador/especialista responsable de la consulta -- ver
  // AsignarConsultaUseCase (asignación manual, solo Administrador; un especialista no se autoasigna).
  asignadoA?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  // RNF-302 (¤24h): se registra la fecha del primer mensaje del equipo para poder medir después
  // cuánto tardó la primera respuesta -- sin necesidad de un cron/alerta automática para el hackathon.
  fechaPrimeraRespuestaEquipo?: Date;
  // Fotos (URLs de /uploads) y ubicación opcionales: gratis, sin depender de ningún plan (M-15).
  // Soporte prioritario (plan Institucional): se marca al enviar la consulta, si quien la envía tiene ese plan vigente. La
  // bandeja del equipo la distingue y permite ordenar por esto; no hay una cola aparte.
  prioritaria?: boolean;
  imagenes?: string[];
  latitud?: number | null;
  longitud?: number | null;
}

// RN-06: alta automática para reportes que ameritan atención urgente (planta en peligro, o
// información incorrecta/peligrosa) -- el resto entra con prioridad normal. Nunca es una opción
// que el formulario de creación exponga al usuario.
export function calcularPrioridad(tipo: TipoConsulta): PrioridadConsulta {
  return tipo === 'ReportePlantaEnPeligro' || tipo === 'ReporteInformacionIncorrecta' ? 'Alta' : 'Normal';
}

export class Consulta {
  constructor(public readonly props: ConsultaProps) {}

  estaCerrada(): boolean { return this.props.estado === 'Cerrada'; }

  // RF-266: un mensaje del equipo avanza el estado (nunca lo hace un mensaje del propio usuario,
  // que solo se agrega al hilo). Pendiente -> EnRevision en el primer contacto. Pasar a "resuelta"
  // (Respondida) es una decisión EXPLÍCITA del equipo (marcarResuelta), no un efecto de responder otra vez. Ya Cerrada, exige reabrir primero.
  registrarMensajeDelEquipo(fecha: Date): void {
    if (this.estaCerrada()) throw new ValidationError('La consulta está cerrada; reábrela antes de agregar un nuevo mensaje del equipo');
    if (!this.props.fechaPrimeraRespuestaEquipo) this.props.fechaPrimeraRespuestaEquipo = fecha;
    if (this.props.estado === 'Pendiente') this.props.estado = 'EnRevision';
    this.props.fechaActualizacion = fecha;
  }

  registrarMensajeDelAutor(fecha: Date): void {
    if (this.estaCerrada()) throw new ValidationError('La consulta está cerrada; reábrela antes de agregar un nuevo mensaje');
    this.props.fechaActualizacion = fecha;
  }

  cerrar(fecha: Date): void {
    if (this.estaCerrada()) throw new ValidationError('La consulta ya está cerrada');
    this.props.estado = 'Cerrada';
    this.props.fechaActualizacion = fecha;
  }

  // Cambios de estado EXPLÍCITOS del equipo (además del avance automático por mensajes): "en proceso" y "resuelta".
  // Visible para el usuario: Pendiente = "pendiente", EnRevision = "en proceso", Respondida y Cerrada = "resuelta".
  marcarEnProceso(fecha: Date): void {
    if (this.props.estado !== 'Pendiente') throw new ValidationError('Solo una consulta pendiente puede pasar a "en proceso"');
    this.props.estado = 'EnRevision';
    if (!this.props.fechaPrimeraRespuestaEquipo) this.props.fechaPrimeraRespuestaEquipo = fecha;
    this.props.fechaActualizacion = fecha;
  }
  marcarResuelta(fecha: Date): void {
    if (this.props.estado !== 'Pendiente' && this.props.estado !== 'EnRevision') throw new ValidationError('La consulta ya está resuelta');
    this.props.estado = 'Respondida';
    if (!this.props.fechaPrimeraRespuestaEquipo) this.props.fechaPrimeraRespuestaEquipo = fecha;
    this.props.fechaActualizacion = fecha;
  }

  reabrir(fecha: Date): void {
    if (this.props.estado !== 'Cerrada' && this.props.estado !== 'Respondida') throw new ValidationError('Solo una consulta resuelta puede reabrirse');
    this.props.estado = 'Pendiente';
    this.props.fechaActualizacion = fecha;
  }

  // RF-266 (SDS): "el sistema cierra tras un periodo de inactividad" -- el SDS no fija un número de
  // días exacto, así que se usa este valor por defecto hasta que se especifique otro. Resuelto de
  // forma perezosa (se evalúa cada vez que la consulta se carga, en vez de un cron/job en segundo
  // plano) porque todavía no hay infraestructura de jobs en el proyecto y el resultado es idéntico
  // para quien la consulta -- nadie está esperando el cierre en tiempo real, así que no hace falta
  // que ocurra exactamente al cumplirse el plazo, solo que sea correcto la próxima vez que se lea.
  static readonly DIAS_INACTIVIDAD_CIERRE = 7;

  // Devuelve true si cerró la consulta (para que el caller sepa que debe persistir el cambio).
  cerrarPorInactividadSiCorresponde(ahora: Date): boolean {
    if (this.props.estado !== 'Respondida') return false;
    const limiteMs = Consulta.DIAS_INACTIVIDAD_CIERRE * 24 * 60 * 60 * 1000;
    if (ahora.getTime() - this.props.fechaActualizacion.getTime() < limiteMs) return false;
    this.props.estado = 'Cerrada';
    this.props.fechaActualizacion = ahora;
    return true;
  }

  // Solo Administrador puede asignar (verificado en AsignarConsultaUseCase, junto con que el
  // destinatario sea parte del equipo) -- este método solo aplica el cambio ya autorizado.
  asignar(especialistaId: string, fecha: Date): void {
    this.props.asignadoA = especialistaId;
    this.props.fechaActualizacion = fecha;
  }
}
