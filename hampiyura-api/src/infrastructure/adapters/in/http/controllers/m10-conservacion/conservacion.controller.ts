import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';
import { Fuente } from '../../../../../../domain/value-objects/fuente.vo';
import { NIVELES_RIESGO_CONSERVACION } from '../../../../../../domain/value-objects/nivel-riesgo-conservacion.vo';
import { ESTADOS_SEGUIMIENTO_ACCION } from '../../../../../../domain/value-objects/estado-seguimiento-accion.vo';

function auth(req:Request) { return (req as AuthenticatedRequest).user; }
function plantaId(req:Request):string { return String(req.params.plantaId); }

const registrarEstadoSchema=z.object({categoria:z.string().min(1),zona:z.string().min(1),amenazas:z.string().min(1),nivelRiesgo:z.enum(NIVELES_RIESGO_CONSERVACION),disponibilidadTemporada:z.string().min(1),recomendacionesConservacion:z.string().min(1),metodosPropagacion:z.string().min(1),alternativasCultivo:z.string().min(1),fuenteOficial:z.string().min(1)});
export async function registrarEstadoConservacion(req:Request,res:Response){
  const {fuenteOficial,...resto}=registrarEstadoSchema.parse(req.body);
  const autorId=auth(req).id;
  const estado=await container.registrarEstadoConservacion.ejecutar({...resto, plantaId:plantaId(req), autorId, fuenteOficial:new Fuente(fuenteOficial)});
  res.status(201).json(estado.props);
}
export async function obtenerEstadoConservacion(req:Request,res:Response){const estado=await container.obtenerEstadoConservacion.ejecutar(plantaId(req)); res.json(estado);}

const registrarAccionSchema=z.object({descripcion:z.string().min(1),responsable:z.string().min(1),evidencias:z.string().min(1),estadoSeguimiento:z.enum(ESTADOS_SEGUIMIENTO_ACCION)});
export async function registrarAccionConservacion(req:Request,res:Response){
  const input=registrarAccionSchema.parse(req.body);
  const autorId=auth(req).id;
  const accion=await container.registrarAccionConservacion.ejecutar({...input, plantaId:plantaId(req), autorId});
  res.status(201).json(accion.props);
}
export async function listarAccionesConservacion(req:Request,res:Response){const acciones=await container.listarAccionesConservacion.ejecutar(plantaId(req)); res.json(acciones.map(a=>a.props));}
