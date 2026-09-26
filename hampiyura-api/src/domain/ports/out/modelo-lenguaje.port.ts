// Puerto hacia el modelo de lenguaje del asistente. Dos adaptadores: proveedor real (Anthropic) y simulado (sin red, sin costo).
export interface MensajeChat { rol: 'user' | 'assistant'; contenido: string }
export interface ModeloLenguajePort {
  readonly simulado: boolean;
  readonly nombre: string;
  generar(sistema: string, mensajes: MensajeChat[]): Promise<string>;
}
