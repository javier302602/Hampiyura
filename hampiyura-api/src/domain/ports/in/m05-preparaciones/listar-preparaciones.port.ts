import { PreparacionVisible } from './obtener-preparacion.port';
// RF-261 (Should, implementado como listado simple): preparaciones alternativas de la misma
// combinación Parte+Uso. Solo devuelve las ya validadas (mismo criterio de visibilidad pública).
export interface ListarPreparacionesPort { ejecutar(parteUsoId: string): Promise<PreparacionVisible[]>; }
