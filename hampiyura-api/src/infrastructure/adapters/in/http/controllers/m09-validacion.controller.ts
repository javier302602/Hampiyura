import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../config/container';
import { AuthenticatedRequest } from '../middlewares/role.middleware';
function auth(req:Request) { return (req as AuthenticatedRequest).user; }
function id(req:Request):string { return String(req.params.id); }
export async function aprobar(req:Request,res:Response){const user=auth(req); await container.aprobar.ejecutar({validacionId:id(req),validadorId:user.id,rol:user.rol}); res.status(204).send();}
export async function observar(req:Request,res:Response){const user=auth(req); await container.observar.ejecutar({validacionId:id(req),validadorId:user.id,rol:user.rol,comentario:String(req.body.comentario)}); res.status(204).send();}
export async function rechazar(req:Request,res:Response){const user=auth(req); await container.rechazar.ejecutar({validacionId:id(req),validadorId:user.id,rol:user.rol,comentario:String(req.body.comentario)}); res.status(204).send();}
export async function listarPendientes(_req:Request,res:Response){const pendientes=await container.listarPendientes.ejecutar(); res.json(pendientes);}

const reportarSchema=z.object({tipoEntidad:z.string().min(1),entidadId:z.string().min(1),motivo:z.string().min(1)});
export async function reportar(req:Request,res:Response){const input=reportarSchema.parse(req.body); const autorId=auth(req).id; const reporte=await container.reportar.ejecutar({...input,autorId}); res.status(201).json(reporte.props);}
export async function listarReportes(_req:Request,res:Response){const reportes=await container.listarReportesPendientes.ejecutar(); res.json(reportes.map(r=>r.props));}
const actualizarReporteSchema=z.object({estado:z.enum(['Revisado','Desestimado'])});
export async function actualizarEstadoReporte(req:Request,res:Response){const input=actualizarReporteSchema.parse(req.body); const reporte=await container.actualizarEstadoReporte.ejecutar(id(req),input.estado); res.json(reporte.props);}
