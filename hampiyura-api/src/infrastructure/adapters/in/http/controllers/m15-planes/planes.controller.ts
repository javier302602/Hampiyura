import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';
import { ValidationError } from '../../../../../../domain/errors/domain.errors';

function usuario(req: Request) { return (req as AuthenticatedRequest).user; }

// Catálogo público de planes (precios de REFERENCIA) + datos de cobro + contador del fondo de conservación.
export async function listarPlanes(_req: Request, res: Response) { res.json(await container.listarPlanes.ejecutar()); }

export async function miPlan(req: Request, res: Response) { res.json(await container.miPlan.ejecutar(usuario(req).id)); }

// El monto NUNCA viene del cliente: lo fija el servidor según el plan (ver plan.vo.ts).
const pagoSchema = z.object({
  concepto: z.enum(['Plan', 'Desbloqueo']),
  plan: z.string().optional(),
  productorId: z.string().optional(),
  metodo: z.string().min(1),
  numeroOperacion: z.string().max(40).optional(),
  comprobanteUrl: z.string().min(1),
});
export async function solicitarPago(req: Request, res: Response) {
  const input = pagoSchema.parse(req.body);
  const u = usuario(req);
  const pago = await container.solicitarPago.ejecutar({ ...input, usuarioId: u.id, rol: u.rol });
  res.status(201).json(pago.props);
}

// --- administración de pagos (solo Administrador) ---
export async function listarPagos(req: Request, res: Response) {
  const estado = req.query.estado === undefined ? undefined : z.enum(['Pendiente', 'Confirmado', 'Rechazado', 'PlanesVigentes', 'DesbloqueosVigentes']).parse(req.query.estado);
  res.json(await container.listarPagosAdmin.ejecutar(estado));
}
export async function detallePago(req: Request, res: Response) { res.json(await container.listarPagosAdmin.detalle(String(req.params.id))); }
export async function confirmarPago(req: Request, res: Response) { await container.resolverPago.confirmar(String(req.params.id), usuario(req).id); res.status(204).send(); }
export async function rechazarPago(req: Request, res: Response) {
  const { motivo } = z.object({ motivo: z.string().min(1, 'El motivo del rechazo es obligatorio') }).parse(req.body);
  await container.resolverPago.rechazar(String(req.params.id), usuario(req).id, motivo);
  res.status(204).send();
}

// --- directorio de productores contactables ---
export async function listarProductores(req: Request, res: Response) {
  const q = req.query;
  const cantidadMinima = q.cantidadMinima !== undefined && q.cantidadMinima !== '' ? Number(q.cantidadMinima) : undefined;
  if (cantidadMinima !== undefined && (!Number.isFinite(cantidadMinima) || cantidadMinima < 0)) throw new ValidationError('La cantidad mínima debe ser un número');
  const filtros = { certificado: q.certificado === '1' || q.certificado === 'true', cantidadMinima, cerca: q.cerca ? String(q.cerca) : undefined };
  res.json(await container.directorioProductores.listar(filtros, usuario(req)));
}
export async function obtenerProductor(req: Request, res: Response) { res.json(await container.directorioProductores.obtener(String(req.params.id), usuario(req))); }
