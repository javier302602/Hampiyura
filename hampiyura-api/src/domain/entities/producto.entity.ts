import { EstadoValidacion } from '../value-objects/estado-validacion.vo';
import { ValidationError } from '../errors/domain.errors';

// RF-272/273: obligatorios = nombre, plantasIds, productorId, localidad, contactoVendedor,
// informacionProceso. El resto es opcional (precio, certificación, fecha exacta, etc.).
export interface ProductoProps {
  id: string;
  productorId: string;
  nombre: string;
  descripcion?: string;
  plantasIds: string[];
  ingredientes?: string;
  presentacion?: string;
  cantidad?: string;
  precioReferencial?: string;
  fotografias: string[];
  localidad: string;
  informacionProceso: string;
  fechaElaboracion?: Date;
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
}
