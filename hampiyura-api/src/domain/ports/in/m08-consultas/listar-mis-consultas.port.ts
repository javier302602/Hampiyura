import { Consulta } from '../../../entities/consulta.entity';
// RF-263: precondición explícita -- cuenta activa (se re-verifica el estado actual del usuario,
// no basta con que el JWT todavía sea válido).
export interface ListarMisConsultasPort { ejecutar(autorId: string): Promise<Consulta[]>; }
