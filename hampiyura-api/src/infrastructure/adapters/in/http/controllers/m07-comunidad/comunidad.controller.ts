import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';

function auth(req:Request) { return (req as AuthenticatedRequest).user; }

const comentarSchema=z.object({texto:z.string().min(1),comentarioPadreId:z.string().optional()});
export async function comentarPublicacion(req:Request,res:Response){
  const input=comentarSchema.parse(req.body);
  const autorId=auth(req).id;
  const comentario=await container.comentarPublicacion.ejecutar({...input, publicacionId:String(req.params.publicacionId), autorId});
  res.status(201).json(comentario.props);
}
export async function listarComentarios(req:Request,res:Response){const comentarios=await container.listarComentarios.ejecutar(String(req.params.publicacionId)); res.json(comentarios);}

const calificarSchema=z.object({estrellas:z.number().int().min(1).max(5)});
export async function calificarPublicacion(req:Request,res:Response){
  const input=calificarSchema.parse(req.body);
  const autorId=auth(req).id;
  const valoracion=await container.calificarPublicacion.ejecutar({...input, publicacionId:String(req.params.publicacionId), autorId});
  res.json(valoracion.props);
}
