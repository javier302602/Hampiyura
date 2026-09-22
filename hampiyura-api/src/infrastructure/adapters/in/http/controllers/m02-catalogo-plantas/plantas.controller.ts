import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
const registrarSchema=z.object({nombreComun:z.string().min(1),nombreCientifico:z.string().min(1),familia:z.string().min(1),region:z.string().min(1),habitat:z.string().min(1),imagenPrincipal:z.string().optional()});
export async function registrarPlanta(req:Request,res:Response){const input=registrarSchema.parse(req.body); const planta=await container.registrarPlanta.ejecutar(input); res.status(201).json(planta.props);}
export async function listarPlantas(_req:Request,res:Response){const plantas=await container.listarPlantas.ejecutar(); res.json(plantas.map(p=>p.props));}
export async function obtenerPlanta(req:Request,res:Response){const planta=await container.obtenerPlanta.ejecutar(String(req.params.id)); res.json(planta);}
