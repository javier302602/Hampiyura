import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
const schema=z.object({nombre:z.string().min(1),descripcion:z.string().optional()});
export async function registrarUso(req:Request,res:Response){const input=schema.parse(req.body); const uso=await container.registrarUso.ejecutar(input); res.status(201).json(uso.props);}
export async function listarUsos(_req:Request,res:Response){const usos=await container.listarUsos.ejecutar(); res.json(usos.map(u=>u.props));}
