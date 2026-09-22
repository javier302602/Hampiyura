import { Preparacion } from '../../../entities/preparacion.entity';
// RF-259: avisoLegal viaja siempre, incondicional -- ver Preparacion.avisoLegal().
export type PreparacionVisible = Preparacion['props'] & { avisoLegal: string };
export interface ObtenerPreparacionPort { ejecutar(id: string): Promise<PreparacionVisible>; }
