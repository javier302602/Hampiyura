import { Uso } from '../../../entities/uso.entity';
export type RegistrarUsoInput = Omit<Uso['props'], 'id'>;
export interface RegistrarUsoPort { ejecutar(input: RegistrarUsoInput): Promise<Uso>; }
