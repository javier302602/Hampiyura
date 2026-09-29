import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';

// M-16 · Pedidos de compra directa y datos de cobro del vendedor.
const u = (req: Request) => (req as AuthenticatedRequest).user;
const sol = (req: Request) => ({ id: u(req).id, rol: u(req).rol });
const entregaSchema = z.object({ nombre: z.string(), telefono: z.string(), direccion: z.string() });

// --- Estado de compra de un producto (público: nunca trae los números de cobro) ---
export async function estadoCompra(req: Request, res: Response) { res.json(await container.estadoCompraProducto.ejecutar(String(req.params.id), u(req)?.id)); }

// --- El vendedor configura cómo cobra ---
export async function obtenerCobro(req: Request, res: Response) { res.json(await container.configurarCobro.obtenerParaVendedor(sol(req), String(req.params.id))); }
export async function configurarCobro(req: Request, res: Response) {
  const b = z.object({ yape: z.string().optional(), plin: z.string().optional(), cuenta: z.string().optional(), entregaDias: z.number(), aceptaCompromiso: z.boolean().optional() }).parse(req.body);
  await container.configurarCobro.ejecutar(sol(req), String(req.params.id), b);
  res.status(204).send();
}

// --- Pedidos ---
export async function vistaPreviaPedido(req: Request, res: Response) {
  const b = z.object({ productoId: z.string().min(1), cantidad: z.number(), entrega: entregaSchema.optional() }).parse(req.body);
  res.json(await container.pedidos.vistaPrevia(u(req).id, b));
}
export async function crearPedido(req: Request, res: Response) {
  const b = z.object({ productoId: z.string().min(1), cantidad: z.number(), entrega: entregaSchema, aceptaContrato: z.boolean() }).parse(req.body);
  const p = await container.pedidos.crear(u(req).id, b);
  res.status(201).json({ id: p.props.id });
}
export async function misPedidos(req: Request, res: Response) {
  const rol = z.enum(['comprador', 'vendedor']).default('comprador').parse(req.query.rol ?? 'comprador');
  res.json(await container.pedidos.listarMios(u(req).id, rol));
}
export async function reclamosPendientes(req: Request, res: Response) { res.json(await container.pedidos.listarReclamos(sol(req))); }
export async function obtenerPedido(req: Request, res: Response) { res.json(await container.pedidos.obtener(sol(req), String(req.params.id))); }
export async function informarPago(req: Request, res: Response) {
  const b = z.object({ metodo: z.string().min(1), comprobanteUrl: z.string().min(1), numeroOperacion: z.string().max(40).optional() }).parse(req.body);
  await container.pedidos.informarPago(sol(req), String(req.params.id), b.metodo, b.comprobanteUrl, b.numeroOperacion); res.status(204).send();
}
export async function confirmarPagoPedido(req: Request, res: Response) { await container.pedidos.confirmarPago(sol(req), String(req.params.id)); res.status(204).send(); }
export async function rechazarPagoPedido(req: Request, res: Response) { const { motivo } = z.object({ motivo: z.string() }).parse(req.body); await container.pedidos.rechazarPago(sol(req), String(req.params.id), motivo); res.status(204).send(); }
export async function marcarEnviado(req: Request, res: Response) { const { nota } = z.object({ nota: z.string() }).parse(req.body); await container.pedidos.marcarEnviado(sol(req), String(req.params.id), nota); res.status(204).send(); }
export async function confirmarRecepcion(req: Request, res: Response) { await container.pedidos.confirmarRecepcion(sol(req), String(req.params.id)); res.status(204).send(); }
export async function abrirReclamo(req: Request, res: Response) { const { motivo } = z.object({ motivo: z.string() }).parse(req.body); await container.pedidos.abrirReclamo(sol(req), String(req.params.id), motivo); res.status(204).send(); }
export async function resolverReclamo(req: Request, res: Response) { const { resolucion } = z.object({ resolucion: z.string() }).parse(req.body); await container.pedidos.resolverReclamo(sol(req), String(req.params.id), resolucion); res.status(204).send(); }
export async function cancelarPedido(req: Request, res: Response) { await container.pedidos.cancelar(sol(req), String(req.params.id)); res.status(204).send(); }
