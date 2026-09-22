import { Planta } from '../../../entities/planta.entity';
// estadoValidacion nunca lo manda quien llama -- RegistrarPlantaUseCase (alta directa, solo
// validador/admin) lo fija en 'Validado'; ProponerPlantaUseCase (Frente 4, cualquier usuario
// autenticado) lo fija en 'Pendiente'. Mismo criterio que 'rol' en el registro de cuentas: nunca
// aceptar del cliente un campo que decide visibilidad/permisos.
export type RegistrarPlantaInput = Omit<Planta['props'], 'id' | 'estadoValidacion'>;
export interface RegistrarPlantaPort { ejecutar(input:RegistrarPlantaInput):Promise<Planta>; }
