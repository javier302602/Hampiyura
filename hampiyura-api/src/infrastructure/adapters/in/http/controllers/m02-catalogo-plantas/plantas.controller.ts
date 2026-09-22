import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';

const registrarSchema=z.object({nombreComun:z.string().min(1),nombreCientifico:z.string().min(1),familia:z.string().min(1),region:z.string().min(1),habitat:z.string().min(1),imagenPrincipal:z.string().optional()});
export async function registrarPlanta(req:Request,res:Response){const input=registrarSchema.parse(req.body); const planta=await container.registrarPlanta.ejecutar(input); res.status(201).json(planta.props);}

// Frente 4 (auditoría): "Proponer planta" -- mismo schema que el alta directa, pero abierta a
// cualquier usuario autenticado (requireAuth en la ruta) y queda Pendiente en vez de Validado.
export async function proponerPlanta(req:Request,res:Response){
  const input=registrarSchema.parse(req.body);
  const proponenteId=(req as AuthenticatedRequest).user.id;
  const planta=await container.proponerPlanta.ejecutar({...input, proponenteId});
  res.status(201).json(planta.props);
}

export async function listarPlantas(_req:Request,res:Response){const plantas=await container.listarPlantas.ejecutar(); res.json(plantas.map(p=>p.props));}
export async function obtenerPlanta(req:Request,res:Response){const planta=await container.obtenerPlanta.ejecutar(String(req.params.id)); res.json(planta);}
