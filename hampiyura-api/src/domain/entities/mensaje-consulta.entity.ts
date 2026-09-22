// RF-266: hilo de mensajes de una consulta, visible para el autor y para el equipo asignado.
// `esEquipo` se decide una sola vez al crear el mensaje (según el rol de quien lo escribe en ese
// momento) -- se guarda en el propio mensaje en vez de resolverlo de nuevo en cada lectura
// consultando el rol actual del autor (que podría cambiar después).
export interface MensajeConsultaProps {
  id: string;
  consultaId: string;
  autorId: string;
  contenido: string;
  esEquipo: boolean;
  fecha: Date;
}
export class MensajeConsulta { constructor(public readonly props: MensajeConsultaProps) {} }
