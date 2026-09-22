/** Extensión futura: integración oficial con fuentes externas (SERNANP, MINSA, UICN...) para
 * consultar o verificar automáticamente el estado de conservación de una especie.
 *
 * NO existe convenio institucional vigente todavía (SDS cap. 23) -- este puerto se declara
 * deliberadamente sin adaptador funcional, igual que mapa-cultivo.port.ts para RF-271. Por ahora
 * (RF-267) la fuente se carga MANUALMENTE por un especialista vía RegistrarEstadoConservacionUseCase;
 * ningún caso de uso depende de este puerto. Ver sernanp.adapter.ts / minsa.adapter.ts.
 */
export interface FuenteExternaPort {
  consultarEstadoConservacion(nombreCientifico: string): Promise<unknown>;
}
