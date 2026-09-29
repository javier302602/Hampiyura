import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';
import { METODOS_COBRO_CULTIVO } from '../../../../../../domain/entities/contrato-cultivo.entity';

// M-17 · Contratos de compra directa de cosecha (ligados a una ficha de cultivo, no a un producto).
const u = (req: Request) => (req as AuthenticatedRequest).user;
const sol = (req: Request) => ({ id: u(req).id, rol: u(req).rol });

export async function proponerContrato(req: Request, res: Response) {
  const b = z.object({ cultivoId: z.string().min(1), cantidad: z.string().min(1), montoAcordado: z.number(), mensaje: z.string().optional() }).parse(req.body);
  const c = await container.contratosCultivo.proponer(u(req).id, b);
  res.status(201).json({ id: c.props.id });
}
export async function misContratosCultivo(req: Request, res: Response) {
  const rol = z.enum(['comprador', 'agricultor']).default('comprador').parse(req.query.rol ?? 'comprador');
  res.json(await container.contratosCultivo.listarMios(u(req).id, rol));
}
export async function obtenerContratoCultivo(req: Request, res: Response) { res.json(await container.contratosCultivo.obtener(sol(req), String(req.params.id))); }
export async function aceptarContratoCultivo(req: Request, res: Response) {
  const b = z.object({ medio: z.enum(METODOS_COBRO_CULTIVO), numero: z.string().min(1) }).parse(req.body);
  await container.contratosCultivo.aceptar(sol(req), String(req.params.id), b.medio, b.numero);
  res.status(204).send();
}
export async function rechazarContratoCultivo(req: Request, res: Response) {
  const { motivo } = z.object({ motivo: z.string() }).parse(req.body);
  await container.contratosCultivo.rechazar(sol(req), String(req.params.id), motivo); res.status(204).send();
}
export async function informarAdelanto(req: Request, res: Response) {
  const b = z.object({ comprobanteUrl: z.string().min(1), numeroOperacion: z.string().max(40).optional() }).parse(req.body);
  await container.contratosCultivo.informarAdelanto(sol(req), String(req.params.id), b.comprobanteUrl, b.numeroOperacion); res.status(204).send();
}
export async function confirmarAdelanto(req: Request, res: Response) { await container.contratosCultivo.confirmarAdelanto(sol(req), String(req.params.id)); res.status(204).send(); }
export async function rechazarAdelanto(req: Request, res: Response) {
  const { motivo } = z.object({ motivo: z.string() }).parse(req.body);
  await container.contratosCultivo.rechazarAdelanto(sol(req), String(req.params.id), motivo); res.status(204).send();
}
export async function marcarCompletadoContratoCultivo(req: Request, res: Response) { await container.contratosCultivo.marcarCompletado(sol(req), String(req.params.id)); res.status(204).send(); }
export async function cancelarContratoCultivo(req: Request, res: Response) { await container.contratosCultivo.cancelar(sol(req), String(req.params.id)); res.status(204).send(); }
