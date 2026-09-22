import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';
import { Fuente } from '../../../../../../domain/value-objects/fuente.vo';
import { TIPOS_CONOCIMIENTO } from '../../../../../../domain/value-objects/tipo-conocimiento.vo';

function auth(req:Request) { return (req as AuthenticatedRequest).user; }

const crearSchema=z.object({plantaId:z.string().min(1),nombreComun:z.string().min(1),descripcion:z.string().min(1),enfermedadesTratadas:z.string().min(1),formaPreparacion:z.string().min(1),imagenes:z.array(z.string()).default([]),tipoConocimiento:z.enum(TIPOS_CONOCIMIENTO),fuente:z.string().min(1)});
export async function crearPublicacion(req:Request,res:Response){
  const {fuente,...resto}=crearSchema.parse(req.body);
  const autorId=auth(req).id;
  const publicacion=await container.crearPublicacion.ejecutar({...resto, autorId, fuente:new Fuente(fuente)});
  res.status(201).json(publicacion.props);
}
export async function obtenerPublicacion(req:Request,res:Response){const usuarioId=(req as AuthenticatedRequest).user?.id; const publicacion=await container.obtenerPublicacion.ejecutar(String(req.params.id), usuarioId); res.json(publicacion);}
export async function listarPublicaciones(_req:Request,res:Response){const publicaciones=await container.listarPublicaciones.ejecutar(); res.json(publicaciones);}

const editarSchema=z.object({nombreComun:z.string().min(1).optional(),descripcion:z.string().min(1).optional(),enfermedadesTratadas:z.string().min(1).optional(),formaPreparacion:z.string().min(1).optional(),imagenes:z.array(z.string()).optional(),tipoConocimiento:z.enum(TIPOS_CONOCIMIENTO).optional(),fuente:z.string().min(1).optional()});
export async function editarPublicacion(req:Request,res:Response){
  const {fuente,...resto}=editarSchema.parse(req.body);
  const publicacion=await container.editarPublicacion.ejecutar(String(req.params.id), auth(req).id, {...resto, ...(fuente?{fuente:new Fuente(fuente)}:{})});
  res.json(publicacion.props);
}
export async function eliminarPublicacion(req:Request,res:Response){const user=auth(req); await container.eliminarPublicacion.ejecutar(String(req.params.id), user.id, user.rol); res.status(204).send();}

const subirMediaSchema=z.object({nombreOriginal:z.string().min(1),contenidoBase64:z.string().min(1)});
export async function subirMedia(req:Request,res:Response){const input=subirMediaSchema.parse(req.body); const resultado=await container.subirMedia.ejecutar(input); res.status(201).json(resultado);}
