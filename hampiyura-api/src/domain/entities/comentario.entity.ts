// RF-13/RF-130: los comentarios cuelgan de una publicación y admiten UN nivel de respuesta
// (comentarioPadreId apunta a un comentario raíz, nunca a otra respuesta). No pasan por M-09,
// pero sí pueden reportarse con el Reporte genérico de FASE 3 (tipoEntidad='Comentario').
export interface ComentarioProps { id: string; publicacionId: string; autorId: string; texto: string; fecha: Date; comentarioPadreId?: string; }
export class Comentario { constructor(public readonly props: ComentarioProps) {} }
