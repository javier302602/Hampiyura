import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { propsPublicasDePlanta } from '../../../../../../domain/entities/planta.entity';
import { TIPOS_PARTE } from '../../../../../../domain/value-objects/tipo-parte.vo';
import { TIPOS_CONOCIMIENTO } from '../../../../../../domain/value-objects/tipo-conocimiento.vo';
import { Fuente } from '../../../../../../domain/value-objects/fuente.vo';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';

const registrarSchema=z.object({nombreComun:z.string().min(1),nombreCientifico:z.string().min(1),familia:z.string().min(1),region:z.string().min(1),habitat:z.string().min(1),imagenPrincipal:z.string().optional(),latitud:z.number().min(-90).max(90).optional(),longitud:z.number().min(-180).max(180).optional()});
// Parte medicinal + uso propuestos junto con la planta (RF-255). Quedan Pendiente en M-09.
const parteUsoSchema=z.object({parte:z.enum(TIPOS_PARTE),parteDetalle:z.string().optional(),usoId:z.string().min(1),motivoUso:z.string().min(1),tipoConocimiento:z.enum(TIPOS_CONOCIMIENTO).default('Tradicional'),fuente:z.string().min(1),contraindicaciones:z.string().optional()});
// De 1 a 8 bloques de parte+uso: una planta suele tener varias partes con usos distintos.
const proponerSchema=registrarSchema.extend({partesUso:z.array(parteUsoSchema).min(1,'Agrega al menos una parte medicinal').max(8,'Una propuesta admite hasta 8 partes medicinales')});
export async function registrarPlanta(req:Request,res:Response){const input=registrarSchema.parse(req.body); const planta=await container.registrarPlanta.ejecutar(input); res.status(201).json(planta.props);}

// Frente 4 (auditoría): "Proponer planta" -- mismo schema que el alta directa, pero abierta a
// cualquier usuario autenticado (requireAuth en la ruta) y queda Pendiente en vez de Validado.
export async function proponerPlanta(req:Request,res:Response){
  const {partesUso,...input}=proponerSchema.parse(req.body);
  const proponenteId=(req as AuthenticatedRequest).user.id;
  const planta=await container.proponerPlanta.ejecutar({...input, proponenteId, partesUso:partesUso.map((p)=>({...p,fuente:new Fuente(p.fuente)}))});
  res.status(201).json(propsPublicasDePlanta(planta.props));
}

export async function listarPlantas(_req:Request,res:Response){const plantas=await container.listarPlantas.ejecutar(); res.json(plantas.map(p=>propsPublicasDePlanta(p.props)));}
export async function obtenerPlanta(req:Request,res:Response){const planta=await container.obtenerPlanta.ejecutar(String(req.params.id)); res.json(planta);}
