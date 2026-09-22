import { ParteUsoVisible } from './obtener-parte-uso.port';
export interface ListarPartesUsoPort { ejecutar(plantaId: string): Promise<ParteUsoVisible[]>; }
