import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { env } from '../../../../../config/env';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';

// Estado público del asistente: la interfaz lo usa para saber si mostrarlo y si está en modo simulado.
export async function estadoAsistente(_req: Request, res: Response) {
  res.json({ activo: env.asistente.activo, simulado: !env.asistente.apiKey });
}

const consultaSchema = z.object({
  mensaje: z.string().min(1, 'Escribe tu pregunta').max(500, 'La pregunta es demasiado larga (máximo 500 caracteres)'),
  historial: z.array(z.object({ rol: z.enum(['user', 'assistant']), contenido: z.string().max(2000) })).max(12).default([]),
});

// Sin sesión también se puede (igual que enviar una consulta general); el límite de uso es por usuario o, si no hay sesión, por IP.
export async function consultarAsistente(req: Request, res: Response) {
  if (!env.asistente.activo) return res.status(503).json({ error: 'El asistente está apagado por el momento. Puedes enviar tu pregunta a un especialista desde "Consultas y ayuda".' });
  const input = consultaSchema.parse(req.body);
  const user = (req as AuthenticatedRequest).user;
  const limite = container.limitadorAsistente.permitir(user?.id ?? `ip:${req.ip}`);
  if (!limite.ok) return res.status(429).json({ error: limite.motivo });
  res.json(await container.consultarAsistente.ejecutar(input.mensaje, input.historial));
}
