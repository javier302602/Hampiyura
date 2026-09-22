import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';
import { Fuente } from '../../../../../../domain/value-objects/fuente.vo';

function auth(req:Request) { return (req as AuthenticatedRequest).user; }

const documentarSchema=z.object({parteUsoId:z.string().min(1),ingredientes:z.string().min(1),pasos:z.string().min(1),herramientas:z.string().min(1),tiempoPreparacion:z.string().min(1),formaTradicionalElaboracion:z.string().min(1),formaConservacion:z.string().min(1),advertencias:z.string().min(1),contraindicaciones:z.string().optional(),fuente:z.string().min(1),localidad:z.string().min(1)});
export async function documentarPreparacion(req:Request,res:Response){
  const {fuente,...resto}=documentarSchema.parse(req.body);
  const autorId=auth(req).id;
  const preparacion=await container.documentarPreparacion.ejecutar({...resto, autorId, fuente:new Fuente(fuente)});
  res.status(201).json(preparacion.props);
}
export async function obtenerPreparacion(req:Request,res:Response){const preparacion=await container.obtenerPreparacion.ejecutar(String(req.params.id)); res.json(preparacion);}
export async function listarPreparaciones(req:Request,res:Response){const preparaciones=await container.listarPreparaciones.ejecutar(String(req.params.parteUsoId)); res.json(preparaciones);}
