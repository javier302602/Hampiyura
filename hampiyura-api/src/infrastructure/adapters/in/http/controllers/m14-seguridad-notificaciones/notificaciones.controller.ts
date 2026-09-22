import { Request, Response } from 'express';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';

function auth(req:Request) { return (req as AuthenticatedRequest).user; }

export async function listarNotificaciones(req:Request,res:Response){const notificaciones=await container.listarNotificaciones.ejecutar(auth(req).id); res.json(notificaciones.map(n=>n.props));}
export async function marcarTodasLeidas(req:Request,res:Response){await container.marcarTodasLeidas.ejecutar(auth(req).id); res.status(204).send();}
export async function marcarLeida(req:Request,res:Response){await container.marcarLeida.ejecutar(String(req.params.id), auth(req).id); res.status(204).send();}
export async function eliminarNotificacion(req:Request,res:Response){await container.eliminarNotificacion.ejecutar(String(req.params.id), auth(req).id); res.status(204).send();}
