import { Fuente } from '../value-objects/fuente.vo';
import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { TipoParte } from '../value-objects/tipo-parte.vo';
import { TipoConocimiento } from '../value-objects/tipo-conocimiento.vo';
import { UnauthorizedError, ValidationError } from '../errors/domain.errors';

// Evidencia de que un uso tradicional fue evaluado científicamente por un especialista o institución. Solo con
// esto (más tipoConocimiento 'Científico' y aprobación de M-09) un uso puede mostrarse como verificado (RF-257).
export interface ValidacionCientificaProps {
  especialista: string;      // nombre del especialista o institución que hizo la prueba
  fecha: Date;               // fecha en que se hizo la prueba/estudio
  evidencia: string;         // descripción CONCRETA de qué prueba se hizo
  enlace?: string;           // enlace al estudio o documento adjunto (/uploads/...)
  registradaPorId: string;   // quién del equipo la registró (auditoría)
  registradaEn: Date;
}

export interface ParteUsoProps {
  id: string;
  plantaId: string;
  autorId: string;
  parte: TipoParte;
  usoId: string;
  tipoConocimiento: TipoConocimiento;
  // RF-255: enlace a la preparación asociada (M-05). M-05 todavía no existe: el campo
  // se declara y persiste, pero nada lo valida ni lo resuelve todavía.
  preparacionId?: string;
  // RF-258: solo se llena si la fuente citada declara contraindicaciones explícitamente.
  // El sistema nunca las infiere ni las autocompleta.
  contraindicaciones?: string;
  // Texto de quien propone: por qué/para qué se usa; y, si parte === 'Otra', cuál es.
  motivoUso?: string;
  parteDetalle?: string;
  fuente: Fuente;
  estadoValidacion: EstadoValidacion;
  // NOTA INTERNA del equipo (teléfono o correo) para contactar a quien aportó el conocimiento o a un especialista
  // dispuesto a evaluarlo. NUNCA se expone al público.
  contactoSeguimiento?: string;
  validacionCientifica?: ValidacionCientificaProps;
}

export interface RegistrarValidacionCientificaInput {
  especialista: string;
  fecha: Date;
  evidencia: string;
  enlace?: string;
  registradaPorId: string;
}

// Frases que por sí solas no son evidencia ("se probó", "está comprobado"...). Se rechazan aunque el campo no esté vacío.
const FRASES_GENERICAS = /^(se\s+(prob[oó]|valid[oó]|comprob[oó]|verific[oó]|estudi[oó]|evalu[oó])|est[aá]\s+(probado|validado|comprobado|verificado)|funciona|es\s+efectivo|ya\s+se\s+prob[oó])[\s.,;!]*$/i;
export const MIN_CARACTERES_EVIDENCIA = 40;
export const MIN_PALABRAS_EVIDENCIA = 6;

export function validarEvidenciaConcreta(evidencia: string) {
  const texto = (evidencia ?? '').trim();
  const palabras = texto.split(/\s+/).filter(Boolean).length;
  if (!texto || FRASES_GENERICAS.test(texto) || texto.length < MIN_CARACTERES_EVIDENCIA || palabras < MIN_PALABRAS_EVIDENCIA) {
    throw new ValidationError(`Describe qué prueba se hizo con detalle concreto (qué se evaluó, cómo y qué resultado dio): mínimo ${MIN_CARACTERES_EVIDENCIA} caracteres y ${MIN_PALABRAS_EVIDENCIA} palabras. Un "se probó" genérico no alcanza.`);
  }
}

export class ParteUso {
  constructor(public readonly props: ParteUsoProps) {}

  tieneEvidenciaCientifica(): boolean { return !!this.props.validacionCientifica; }

  // RF-257 (criterio de aceptación): NUNCA se presenta como "tratamiento verificado" si no hay evidencia científica
  // registrada, aunque un especialista haya aprobado la propuesta en moderación (M-09): aprobar el contenido no es
  // lo mismo que validarlo científicamente. Verificado = tipo Científico + aprobado + evidencia registrada.
  puedeMostrarseComoVerificado(): boolean {
    return this.props.tipoConocimiento === 'Científico' && this.props.estadoValidacion === 'Validado' && this.tieneEvidenciaCientifica();
  }

  etiquetaAdvertencia(): string | null {
    if (this.puedeMostrarseComoVerificado()) return null;
    if (this.props.tipoConocimiento === 'Científico' && !this.tieneEvidenciaCientifica()) {
      return 'Este uso se declaró como científico, pero el equipo todavía no registró la evidencia de esa validación. No debe interpretarse como un tratamiento médico verificado.';
    }
    return 'Este uso no está verificado científicamente: se basa en conocimiento tradicional o está pendiente de validación por un especialista. No debe interpretarse como un tratamiento médico verificado.';
  }

  // El seguimiento (contacto interno y validación científica) aplica a un uso ya APROBADO cuyo tipo es Tradicional,
  // Documentado o Científico y que todavía NO tiene evidencia registrada. Los tres comparten el mismo camino a
  // verificado: declarar "Científico" al proponer no es un atajo, también necesita este registro. ("Pendiente" no
  // aplica: primero hay que saber de qué tipo de conocimiento se trata.)
  static readonly TIPOS_CON_SEGUIMIENTO: readonly string[] = ['Tradicional', 'Documentado', 'Científico'];
  private exigirAprobadoSinEvidencia() {
    if (this.props.estadoValidacion !== 'Validado') throw new ValidationError('Primero debe aprobarse en la bandeja de validación');
    if (this.props.validacionCientifica) throw new ValidationError('Este uso ya tiene su validación científica registrada');
    if (!ParteUso.TIPOS_CON_SEGUIMIENTO.includes(this.props.tipoConocimiento)) throw new ValidationError('Este uso está marcado como "Pendiente": primero debe indicarse si es conocimiento Tradicional, Documentado o Científico');
  }

  // ¿Está en el camino a la validación científica? (aprobado + tipo aplicable + sin evidencia).
  puedeRegistrarValidacionCientifica(): boolean {
    return this.props.estadoValidacion === 'Validado' && ParteUso.TIPOS_CON_SEGUIMIENTO.includes(this.props.tipoConocimiento) && !this.props.validacionCientifica;
  }

  // Área de ParteUso en M-09: Especialista en salud o Administrador (mismo criterio que la aprobación).
  static exigirRolDeSeguimiento(rol: string) {
    if (rol !== 'Administrador' && rol !== 'EspecialistaSalud') throw new UnauthorizedError('Solo un Especialista en salud o un Administrador puede gestionar la validación científica de un uso');
  }

  actualizarContactoSeguimiento(contacto: string | null | undefined) {
    this.exigirAprobadoSinEvidencia();
    const c = contacto?.trim();
    if (!c) { this.props.contactoSeguimiento = undefined; return; }
    const esCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
    const esTelefono = /^[+0-9()\-\s]{6,20}$/.test(c);
    if (!esCorreo && !esTelefono) throw new ValidationError('El contacto de seguimiento debe ser un teléfono o un correo válido');
    this.props.contactoSeguimiento = c;
  }

  // Camino real a verificado (desde Tradicional, Documentado o Científico): exige quién, cuándo y qué evidencia concreta.
  // El tipo pasa a 'Científico' (si no lo era ya) y, junto con la evidencia y la aprobación vigente, habilita el sello.
  registrarValidacionCientifica(input: RegistrarValidacionCientificaInput, ahora = new Date()) {
    this.exigirAprobadoSinEvidencia();
    const especialista = input.especialista?.trim();
    if (!especialista || especialista.length < 3) throw new ValidationError('Indica el nombre del especialista o de la institución que hizo la prueba');
    if (!(input.fecha instanceof Date) || Number.isNaN(input.fecha.getTime())) throw new ValidationError('Indica la fecha en que se hizo la prueba');
    if (input.fecha.getTime() > ahora.getTime() + 24 * 60 * 60 * 1000) throw new ValidationError('La fecha de la prueba no puede ser futura');
    validarEvidenciaConcreta(input.evidencia);
    const enlace = input.enlace?.trim() || undefined;
    if (enlace && !/^https?:\/\/\S+$/i.test(enlace) && !enlace.startsWith('/uploads/')) throw new ValidationError('El enlace al estudio debe ser una URL http(s) o un documento subido a la plataforma');
    this.props.validacionCientifica = { especialista, fecha: input.fecha, evidencia: input.evidencia.trim(), enlace, registradaPorId: input.registradaPorId, registradaEn: ahora };
    this.props.tipoConocimiento = 'Científico';
  }
}
