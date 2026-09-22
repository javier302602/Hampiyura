import { Request, Response } from 'express';
import { container } from '../../../../../config/container';

function param(req:Request, nombre:string):string|undefined { const valor=req.query[nombre]; return typeof valor==='string' && valor.trim() ? valor : undefined; }

// RF-17/18/42/110/148/153/19: GET /api/buscar?q=&enfermedad=&propiedad=&categoria=
export async function buscarPlantas(req:Request,res:Response){
  const resultados=await container.buscarPlantas.ejecutar({
    q:param(req,'q'),
    enfermedad:param(req,'enfermedad'),
    propiedad:param(req,'propiedad'),
    categoria:param(req,'categoria'),
  });
  res.json(resultados);
}
