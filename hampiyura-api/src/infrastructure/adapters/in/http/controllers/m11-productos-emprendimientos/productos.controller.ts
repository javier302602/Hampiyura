import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';

function auth(req:Request) { return (req as AuthenticatedRequest).user; }

// Frente 3: plantasUtilizadas (entrada estructurada: planta/parte usada/estado/cantidad) reemplaza
// los checkboxes de una lista fija en el formulario. plantasIds ya NO lo manda el cliente -- se
// deriva acá de las entradas que sí tienen plantaId (match contra el catálogo, resuelto en el
// frontend), para que la regla de negocio "toda planta referenciada debe existir en el catálogo"
// (PublicarProductoUseCase) se siga cumpliendo exactamente igual que antes sin tocarla.
const plantaUtilizadaSchema=z.object({
  plantaId:z.string().min(1).optional(),
  plantaNombreLibre:z.string().min(1),
  parteUsada:z.string().min(1),
  estado:z.string().min(1),
  cantidad:z.string().optional(),
});
const publicarSchema=z.object({
  nombre:z.string().min(1),
  descripcion:z.string().optional(),
  plantasUtilizadas:z.array(plantaUtilizadaSchema).min(1,'Debes indicar al menos una planta utilizada'),
  ingredientes:z.string().optional(),
  presentacion:z.string().optional(),
  cantidad:z.string().optional(),
  precioReferencial:z.string().optional(),
  fotografias:z.array(z.string()).default([]),
  localidad:z.string().min(1),
  // Frente 6: coordenadas reales del pin del mapa (antes se descartaban) -- opcionales porque
  // localidad sigue siendo editable a mano sin pasar por el mapa.
  latitud:z.number().optional(),
  longitud:z.number().optional(),
  informacionProceso:z.string().min(1),
  // <input type="date"> del frontend manda "YYYY-MM-DD" (fecha sin hora) -- z.string().datetime()
  // exige un ISO datetime completo con hora/zona y rechazaba ese formato con un error de Zod poco
  // claro para quien publica. z.string().date() valida exactamente ese formato.
  fechaElaboracion:z.string().date().optional(),
  contactoVendedor:z.string().min(1),
  aceptaComision:z.boolean().optional(),
});
export async function publicarProducto(req:Request,res:Response){
  const {fechaElaboracion,plantasUtilizadas,...resto}=publicarSchema.parse(req.body);
  const productorId=auth(req).id;
  const plantasIds=[...new Set(plantasUtilizadas.map((p)=>p.plantaId).filter((id):id is string=>!!id))];
  const producto=await container.publicarProducto.ejecutar({...resto, plantasIds, plantasUtilizadas, productorId, fechaElaboracion:fechaElaboracion?new Date(fechaElaboracion):undefined});
  res.status(201).json(producto.props);
}
// M-15: el contacto del vendedor solo lo ve quien tenga plan activo o un desbloqueo vigente de ese productor.
export async function obtenerProducto(req:Request,res:Response){const producto=await container.obtenerProducto.ejecutar(String(req.params.id)); const [protegido]=await container.protegerContactoProductos.aplicar([producto],auth(req)); res.json(protegido);}
export async function listarProductos(req:Request,res:Response){
  const filtros={localidad:req.query.localidad?String(req.query.localidad):undefined, plantaId:req.query.plantaId?String(req.query.plantaId):undefined};
  const productos=await container.listarProductos.ejecutar(filtros);
  res.json(await container.protegerContactoProductos.aplicar(productos,auth(req)));
}
export async function marcarValidadoDocumentalmente(req:Request,res:Response){const producto=await container.marcarValidadoDocumentalmente.ejecutar(String(req.params.id)); res.json(producto.props);}
const certificarSchema=z.object({documentacion:z.string().min(1)});
export async function marcarCertificado(req:Request,res:Response){const input=certificarSchema.parse(req.body); const producto=await container.marcarCertificado.ejecutar(String(req.params.id), input.documentacion); res.json(producto.props);}

const verificarAfirmacionesSchema=z.object({nombre:z.string().optional(),descripcion:z.string().optional(),informacionProceso:z.string().optional(),ingredientes:z.string().optional()});
export async function verificarAfirmaciones(req:Request,res:Response){const input=verificarAfirmacionesSchema.parse(req.body); const resultado=await container.verificarAfirmaciones.ejecutar(input); res.json(resultado);}
