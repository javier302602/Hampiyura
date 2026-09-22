import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';
import { Fuente } from '../../../../../../domain/value-objects/fuente.vo';
import { TIPOS_PARTE } from '../../../../../../domain/value-objects/tipo-parte.vo';
import { TIPOS_CONOCIMIENTO } from '../../../../../../domain/value-objects/tipo-conocimiento.vo';
const schema=z.object({plantaId:z.string().min(1),parte:z.enum(TIPOS_PARTE),usoId:z.string().min(1),tipoConocimiento:z.enum(TIPOS_CONOCIMIENTO),preparacionId:z.string().optional(),contraindicaciones:z.string().optional(),fuente:z.string().min(1)});
export async function registrarParteUso(req:Request,res:Response){
  const {fuente,...resto}=schema.parse(req.body);
  const autorId=(req as AuthenticatedRequest).user.id;
  const parteUso=await container.registrarParteUso.ejecutar({...resto, autorId, fuente:new Fuente(fuente)});
  res.status(201).json(parteUso.props);
}
export async function obtenerParteUso(req:Request,res:Response){const parteUso=await container.obtenerParteUso.ejecutar(String(req.params.id)); res.json(parteUso);}
export async function listarPartesUsoPorPlanta(req:Request,res:Response){const partesUso=await container.listarPartesUso.ejecutar(String(req.params.plantaId)); res.json(partesUso);}
