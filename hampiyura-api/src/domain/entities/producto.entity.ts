import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { TipoProductor } from '../value-objects/tipo-productor.vo';
import { ValidationError } from '../errors/domain.errors';

// Frente 3: entrada estructurada de "planta utilizada" -- reemplaza los checkboxes de una lista
// fija. plantaId queda vacío cuando el texto libre no hizo match con el catálogo (el frontend
// intenta el match; el backend no vuelve a intentarlo, solo confía en lo que llega). plantasIds
// (abajo) se sigue derivando de las entradas que SÍ tienen plantaId, así ningún consumidor
// existente (ProductoCard, filtro por plantaId) se entera del cambio.
export interface PlantaUtilizada {
  plantaId?: string;
  plantaNombreLibre: string;
  parteUsada: string;
  estado: string;
  cantidad?: string;
}

// RF-272/273: obligatorios = nombre, plantasIds, productorId, localidad, contactoVendedor,
// informacionProceso. El resto es opcional (precio, certificación, fecha exacta, etc.).
export interface ProductoProps {
  id: string;
  productorId: string;
  nombre: string;
  descripcion?: string;
  plantasIds: string[];
  plantasUtilizadas?: PlantaUtilizada[];
  ingredientes?: string;
  presentacion?: string;
  cantidad?: string;
  precioReferencial?: string;
  // Ronda 36 (M-16): stock REAL en unidades. undefined/null = el vendedor no lo gestiona (sin límite mostrado).
  stockDisponible?: number | null;
  fotografias: string[];
  localidad: string;
  // Frente 6: coordenadas reales del pin soltado en SelectorUbicacionMapa (Frente 3) -- antes se
  // usaban solo para geocodificación inversa y se descartaban. Opcionales: localidad sigue siendo
  // texto editable a mano, y los productos publicados antes de este cambio no las tienen.
  latitud?: number;
  longitud?: number;
  informacionProceso: string;
  fechaElaboracion?: Date;
  // Ronda 18. tipoProductor es obligatorio al publicar (los productos anteriores no lo tienen); el resto es opcional y
  // NUNCA se rellena por el sistema: si el productor no lo completa, queda vacío y la ficha dice "no especificado".
  tipoProductor?: TipoProductor;
  categoriasUso?: string[];   // nombres del catálogo de usos de M-04 (Digestivo, Cosmético, ...), sin lista paralela
  modoDeUso?: string;
  contraindicaciones?: string;
  contactoVendedor: string;
  documentacionCertificacion?: string;
  // RF-274: no bloquea la creación, pero marca el producto para revisión manual reforzada.
  requiereRevisionReforzada: boolean;
  etiquetaValidadoDocumental: boolean;
  etiquetaCertificado: boolean;
  estadoValidacion: EstadoValidacion;
}

export class Producto {
  constructor(public readonly props: ProductoProps) {}

  // "Revisado por el equipo": se deriva de estadoValidacion en vez de guardarse aparte, para
  // que quede sincronizado automáticamente por el mismo mecanismo de M-09 (RegistroEntidadesValidables)
  // sin lógica especial -- y para que nunca pueda desincronizarse de si M-09 aprobó o no.
  revisadoPorEquipo(): boolean { return this.props.estadoValidacion === 'Validado'; }
  esVisiblePublicamente(): boolean { return this.props.estadoValidacion === 'Validado'; }

  // "Validado documentalmente" NO es automático: alguien (especialista/admin) debe verificar
  // la fuente/documentación explícitamente. Es independiente de "Revisado" y de "Certificado".
  marcarValidadoDocumentalmente() { this.props.etiquetaValidadoDocumental = true; }

  // "Certificado por entidad competente": exige una certificación real adjunta y que el producto
  // ya esté aprobado/publicado (criterio de aceptación de RF-272: nunca "certificado" sin más).
  marcarCertificado(documentacion: string) {
    if (this.props.estadoValidacion !== 'Validado') throw new ValidationError('No se puede certificar un producto que todavía no fue aprobado y publicado');
    if (!documentacion?.trim()) throw new ValidationError('Debes adjuntar una certificación real (documento) para marcar el producto como certificado');
    this.props.documentacionCertificacion = documentacion;
    this.props.etiquetaCertificado = true;
  }

  // Ronda 36 (M-16): el dueño fija/edita el stock; null = deja de gestionarlo (sin límite mostrado).
  fijarStock(unidades: number | null) {
    if (unidades !== null && (!Number.isInteger(unidades) || unidades < 0)) throw new ValidationError('El stock debe ser un número entero de 0 a más, o vacío para no gestionarlo');
    this.props.stockDisponible = unidades;
  }
  hayStockPara(cantidad: number): boolean { return this.props.stockDisponible == null || this.props.stockDisponible >= cantidad; }
  // Se descuenta SOLO cuando el vendedor confirma un pago real (nunca al solo pedir ni con el comprobante sin confirmar). Nunca baja de 0.
  descontarStock(cantidad: number) { if (this.props.stockDisponible != null) this.props.stockDisponible = Math.max(0, this.props.stockDisponible - cantidad); }
}
