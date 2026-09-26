import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';

// Ronda 30 · M-15: mensajería directa, alertas de seguimiento (plan Negocio), reportes (plan Institucional) y "Productores disponibles" (Premium).
const u = (req: Request) => (req as AuthenticatedRequest).user;
const sol = (req: Request) => ({ id: u(req).id, rol: u(req).rol });

// --- Mensajería directa ---
export async function listarConversaciones(req: Request, res: Response) { res.json(await container.mensajeria.listar(u(req).id)); }
export async function mensajesSinLeer(req: Request, res: Response) { res.json({ sinLeer: await container.mensajeria.sinLeerTotal(u(req).id) }); }
export async function obtenerConversacion(req: Request, res: Response) { res.json(await container.mensajeria.obtener(u(req).id, String(req.params.id))); }
export async function escribirAProductor(req: Request, res: Response) {
  const { productorId, texto } = z.object({ productorId: z.string().min(1), texto: z.string() }).parse(req.body);
  res.status(201).json(await container.mensajeria.escribirAProductor(sol(req), productorId, texto));
}
export async function responderConversacion(req: Request, res: Response) {
  const { texto } = z.object({ texto: z.string() }).parse(req.body);
  await container.mensajeria.responder(sol(req), String(req.params.id), texto);
  res.status(201).json({ ok: true });
}

// --- Alertas de seguimiento ---
export async function listarAlertas(req: Request, res: Response) { await container.alertas.procesarUsuario(u(req).id); res.json(await container.alertas.listar(u(req).id)); }
export async function seguirPlanta(req: Request, res: Response) {
  const b = z.object({ plantaId: z.string().min(1), disponibilidad: z.boolean().optional(), temporada: z.boolean().optional() }).parse(req.body);
  await container.alertas.seguir(u(req).id, b.plantaId, b);
  res.status(201).json(await container.alertas.listar(u(req).id));
}
export async function dejarDeSeguir(req: Request, res: Response) { await container.alertas.dejarDeSeguir(u(req).id, String(req.params.plantaId)); res.status(204).send(); }
export async function procesarAlertas(_req: Request, res: Response) { res.json({ notificacionesEnviadas: await container.alertas.procesarTodas() }); }

// --- Reportes agregados (Institucional) ---
export async function reporteBioeconomia(req: Request, res: Response) { res.json(await container.reporteBioeconomia.ejecutar(sol(req))); }

// --- Productores disponibles (Premium) ---
export async function accesoDisponibles(req: Request, res: Response) { res.json(await container.productoresDisponibles.acceso_(u(req) ? sol(req) : undefined)); }
export async function listarDisponibles(req: Request, res: Response) {
  const q = req.query;
  res.json(await container.productoresDisponibles.listar(sol(req), { planta: q.planta ? String(q.planta) : undefined, zona: q.zona ? String(q.zona) : undefined, tipo: q.tipo ? String(q.tipo) : undefined }));
}
export async function miDisponibilidad(req: Request, res: Response) { res.json(await container.productoresDisponibles.miEstado(u(req).id)); }
export async function marcarDisponibilidad(req: Request, res: Response) {
  const { disponible, nota } = z.object({ disponible: z.boolean(), nota: z.string().max(200).optional() }).parse(req.body);
  res.json(await container.productoresDisponibles.marcar(sol(req), disponible, nota));
}
