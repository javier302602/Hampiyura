export interface UsoProps { id: string; nombre: string; descripcion?: string; }
export class Uso { constructor(public readonly props: UsoProps) {} }
