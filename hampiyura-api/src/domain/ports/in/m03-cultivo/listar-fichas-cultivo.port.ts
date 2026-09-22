import { FichaCultivoVisible } from './obtener-ficha-cultivo.port';
export interface ListarFichasCultivoPort { ejecutar(plantaId: string): Promise<FichaCultivoVisible[]>; }
