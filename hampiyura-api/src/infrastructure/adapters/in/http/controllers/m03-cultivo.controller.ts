import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../config/container';
import { Fuente } from '../../../../../domain/value-objects/fuente.vo';
import { CalendarioCultivo } from '../../../../../domain/value-objects/calendario-cultivo.vo';
import { aVistaFichaCultivo } from '../../../../../application/m03-cultivo/obtener-ficha-cultivo.use-case';
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
// Público: solo fichas validadas. ?estado=todas (solo Especialista/Administrador) incluye las pendientes
// para la vista de gestión; para cualquier otro llamante el parámetro se ignora.
export async function listarMapaCultivo(req:Request,res:Response){
  const usuario=(req as AuthenticatedRequest).user;
  const esValidador=!!usuario && (usuario.rol==='Administrador' || usuario.rol.startsWith('Especialista'));
  const mapa=await container.listarMapaCultivo.ejecutar({incluirNoValidadas: esValidador && req.query.estado==='todas'});
  res.json(mapa);
}

// Guía de cultivo: solo Especialista en agronomía o Administrador (la regla vive en Cultivo.actualizarGuia).
const guiaSchema=z.record(z.string(),z.string().max(1500).nullable());
export async function actualizarGuiaCultivo(req:Request,res:Response){
  const input=guiaSchema.parse(req.body); const user=(req as AuthenticatedRequest).user;
  const cultivo=await container.actualizarGuiaCultivo.ejecutar(String(req.params.id),input,user);
  res.json(aVistaFichaCultivo(cultivo));
}
