import { Preparacion } from '../../../entities/preparacion.entity';
export type DocumentarPreparacionInput = Omit<Preparacion['props'], 'id' | 'estadoValidacion' | 'fecha'>;
export interface DocumentarPreparacionPort { ejecutar(input: DocumentarPreparacionInput): Promise<Preparacion>; }
