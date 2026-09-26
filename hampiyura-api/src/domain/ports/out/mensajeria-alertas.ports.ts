// Ronda 30 · puertos de salida de M-15: mensajería directa (plan Negocio), alertas de seguimiento (plan Negocio),
// disponibilidad de productores (complemento Premium) y registro anónimo de búsquedas (reportes Institucional).

export interface ConversacionDatos { id: string; compradorId: string; productorId: string; creadaEn: Date; actualizadaEn: Date }
export interface MensajeDirectoDatos { id: string; conversacionId: string; autorId: string; texto: string; creadoEn: Date; leidoEn?: Date }
export interface MensajeriaRepositoryPort {
  buscarConversacion(compradorId: string, productorId: string): Promise<ConversacionDatos | null>;
  buscarConversacionPorId(id: string): Promise<ConversacionDatos | null>;
  crearConversacion(c: ConversacionDatos): Promise<void>;
  listarConversacionesDe(usuarioId: string): Promise<ConversacionDatos[]>;
  listarMensajes(conversacionId: string): Promise<MensajeDirectoDatos[]>;
  guardarMensaje(m: MensajeDirectoDatos): Promise<void>;
  marcarLeidos(conversacionId: string, lectorId: string, ahora: Date): Promise<void>;
  contarMensajesDesde(autorId: string, desde: Date): Promise<number>;
}

export interface AlertaDatos {
  id: string; usuarioId: string; plantaId: string; disponibilidad: boolean; temporada: boolean;
  productosNotificados: string[]; ultimaTemporada?: string; creadoEn: Date;
}
export interface AlertasRepositoryPort {
  listarPorUsuario(usuarioId: string): Promise<AlertaDatos[]>;
  listarTodas(): Promise<AlertaDatos[]>;
  buscar(usuarioId: string, plantaId: string): Promise<AlertaDatos | null>;
  guardar(a: AlertaDatos): Promise<void>; // upsert por (usuario, planta)
  eliminar(usuarioId: string, plantaId: string): Promise<void>;
}

export interface DisponibilidadProductor { productorId: string; hasta: Date; nota?: string }
export interface DisponibilidadRepositoryPort {
  establecer(productorId: string, hasta: Date | null, nota?: string): Promise<void>;
  listarVigentes(ahora: Date): Promise<DisponibilidadProductor[]>;
  obtener(productorId: string): Promise<DisponibilidadProductor | null>;
}

export interface BusquedasRepositoryPort {
  registrar(plantaIds: string[], fecha: Date): Promise<void>;
  contarPorPlanta(desde?: Date): Promise<{ plantaId: string; cantidad: number }[]>;
}
