import { ParteUso } from '../../../entities/parte-uso.entity';
export type RegistrarParteUsoInput = Omit<ParteUso['props'], 'id' | 'estadoValidacion'>;
export interface RegistrarParteUsoPort { ejecutar(input: RegistrarParteUsoInput): Promise<ParteUso>; }
