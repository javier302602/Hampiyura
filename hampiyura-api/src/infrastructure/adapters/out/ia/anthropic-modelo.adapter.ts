import { ModeloLenguajePort, MensajeChat } from '../../../../domain/ports/out/modelo-lenguaje.port';

// Proveedor real: API de mensajes de Anthropic (Claude). Temperatura 0 para respuestas lo más apegadas posible al contexto entregado.
export class AnthropicModeloAdapter implements ModeloLenguajePort {
  readonly simulado = false;
  readonly nombre: string;
  constructor(private readonly apiKey: string, private readonly modelo: string) { this.nombre = `Anthropic ${modelo}`; }
  async generar(sistema: string, mensajes: MensajeChat[]): Promise<string> {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: this.modelo, max_tokens: 700, temperature: 0, system: sistema, messages: mensajes.map((m) => ({ role: m.rol, content: m.contenido })) }),
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error(`El proveedor de IA respondió ${r.status}`);
    const data = await r.json() as { content?: { type: string; text?: string }[] };
    return (data.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('').trim();
  }
}
