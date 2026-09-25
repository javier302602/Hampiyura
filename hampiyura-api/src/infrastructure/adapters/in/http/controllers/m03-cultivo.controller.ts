import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../config/container';
import { Fuente } from '../../../../../domain/value-objects/fuente.vo';
import { CalendarioCultivo } from '../../../../../domain/value-objects/calendario-cultivo.vo';
import { AuthenticatedRequest } from '../middlewares/role.middleware';

function auth(req:Request) { return (req as AuthenticatedRequest).user; }

const mes=z.number().int().min(1).max(12);
const schema=z.object({plantaId:z.string().min(1),zonaCultivo:z.string(),condicionesClimaticas:z.string(),tipoSuelo:z.string(),altitudAprox:z.string(),aguaNecesaria:z.string(),exposicionSolar:z.string(),epocaSiembra:z.string(),metodoPropagacion:z.string(),tiempoCrecimiento:z.string(),cuidados:z.string(),plagasComunes:z.string(),epocaCosecha:z.string(),recomendacionesSobreexplotacion:z.string(),consejosRecoleccion:z.string().min(1),mesesSiembra:z.array(mes),mesesCosecha:z.array(mes),fuente:z.string().min(1)});
export async function registrarFicha(req:Request,res:Response){
  const {mesesSiembra,mesesCosecha,fuente,...resto}=schema.parse(req.body);
  const cultivo=await container.registrarCultivo.ejecutar({...resto, autorId:auth(req).id, fuente:new Fuente(fuente), calendario:new CalendarioCultivo(mesesSiembra,mesesCosecha)});
  res.status(201).json(cultivo.props);
}
export async function obtenerFicha(req:Request,res:Response){const ficha=await container.obtenerFichaCultivo.ejecutar(String(req.params.id)); res.json(ficha);}
export async function listarFichasPorPlanta(req:Request,res:Response){const fichas=await container.listarFichasCultivo.ejecutar(String(req.params.plantaId)); res.json(fichas);}

// RF-271 -- mapa de distribución
const ubicacionSchema=z.object({zona:z.string().min(1),latitud:z.number().optional(),longitud:z.number().optional()});
export async function registrarUbicacionCultivo(req:Request,res:Response){
  const input=ubicacionSchema.parse(req.body);
  const autorId=auth(req).id;
  const ubicacion=await container.registrarUbicacionCultivo.ejecutar({...input, cultivoId:String(req.params.cultivoId), autorId});
  res.status(201).json(ubicacion.props);
}
export async function obtenerUbicacionCultivo(req:Request,res:Response){const ubicacion=await container.obtenerUbicacionCultivo.ejecutar(String(req.params.cultivoId)); res.json(ubicacion?.props ?? null);}
export async function listarMapaCultivo(_req:Request,res:Response){const mapa=await container.listarMapaCultivo.ejecutar(); res.json(mapa);}
