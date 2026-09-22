import { FuenteExternaPort } from '../../../../domain/ports/out/fuente-externa.port';

/** Deliberadamente NO implementado: no existe convenio institucional con MINSA (SDS cap. 23).
 * No lo "arregles" para que responda algo -- eso inventaría una integración oficial que no existe.
 * La fuente se carga manualmente por un especialista (ver RegistrarEstadoConservacionUseCase). */
export class MinsaAdapter implements FuenteExternaPort {
  async consultarEstadoConservacion(_nombreCientifico: string): Promise<unknown> {
    throw new Error('Integración con MINSA no disponible: no hay convenio institucional vigente. La fuente debe cargarse manualmente por un especialista.');
  }
}
