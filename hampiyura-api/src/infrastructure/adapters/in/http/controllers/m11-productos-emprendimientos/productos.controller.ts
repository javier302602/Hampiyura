import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';

function auth(req:Request) { return (req as AuthenticatedRequest).user; }

const publicarSchema=z.object({
  nombre:z.string().min(1),
  descripcion:z.string().optional(),
  plantasIds:z.array(z.string().min(1)).min(1),
  ingredientes:z.string().optional(),
  presentacion:z.string().optional(),
  cantidad:z.string().optional(),
  precioReferencial:z.string().optional(),
  fotografias:z.array(z.string()).default([]),
  localidad:z.string().min(1),
  informacionProceso:z.string().min(1),
  // <input type="date"> del frontend manda "YYYY-MM-DD" (fecha sin hora) -- z.string().datetime()
  // exige un ISO datetime completo con hora/zona y rechazaba ese formato con un error de Zod poco
  // claro para quien publica. z.string().date() valida exactamente ese formato.
  fechaElaboracion:z.string().date().optional(),
  contactoVendedor:z.string().min(1),
});
export async function publicarProducto(req:Request,res:Response){
  const {fechaElaboracion,...resto}=publicarSchema.parse(req.body);
  const productorId=auth(req).id;
  const producto=await container.publicarProducto.ejecutar({...resto, productorId, fechaElaboracion:fechaElaboracion?new Date(fechaElaboracion):undefined});
  res.status(201).json(producto.props);
}
export async function obtenerProducto(req:Request,res:Response){const producto=await container.obtenerProducto.ejecutar(String(req.params.id)); res.json(producto);}
export async function listarProductos(req:Request,res:Response){
  const filtros={localidad:req.query.localidad?String(req.query.localidad):undefined, plantaId:req.query.plantaId?String(req.query.plantaId):undefined};
  const productos=await container.listarProductos.ejecutar(filtros);
  res.json(productos);
}
export async function marcarValidadoDocumentalmente(req:Request,res:Response){const producto=await container.marcarValidadoDocumentalmente.ejecutar(String(req.params.id)); res.json(producto.props);}
const certificarSchema=z.object({documentacion:z.string().min(1)});
export async function marcarCertificado(req:Request,res:Response){const input=certificarSchema.parse(req.body); const producto=await container.marcarCertificado.ejecutar(String(req.params.id), input.documentacion); res.json(producto.props);}

const verificarAfirmacionesSchema=z.object({nombre:z.string().optional(),descripcion:z.string().optional(),informacionProceso:z.string().optional(),ingredientes:z.string().optional()});
export async function verificarAfirmaciones(req:Request,res:Response){const input=verificarAfirmacionesSchema.parse(req.body); const resultado=await container.verificarAfirmaciones.ejecutar(input); res.json(resultado);}
