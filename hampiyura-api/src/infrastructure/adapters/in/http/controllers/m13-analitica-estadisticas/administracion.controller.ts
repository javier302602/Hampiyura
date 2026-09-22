import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { ROLES } from '../../../../../../domain/value-objects/rol.vo';

function idParam(req:Request):string { return String(req.params.id); }

export async function obtenerPanel(_req:Request,res:Response){const panel=await container.obtenerPanelAdmin.ejecutar(); res.json(panel);}
export async function listarUsuarios(_req:Request,res:Response){
  const usuarios=await container.listarUsuarios.ejecutar();
  res.json(usuarios.map(u=>({id:u.props.id,nombre:u.props.nombre,correo:u.props.correo,rol:u.props.rol,estado:u.props.estado})));
}
export async function suspenderUsuario(req:Request,res:Response){const usuario=await container.suspenderUsuario.ejecutar(idParam(req)); res.json({id:usuario.props.id,estado:usuario.props.estado});}
export async function reactivarUsuario(req:Request,res:Response){const usuario=await container.reactivarUsuario.ejecutar(idParam(req)); res.json({id:usuario.props.id,estado:usuario.props.estado});}
const cambiarRolSchema=z.object({rol:z.enum(ROLES)});
// Ruta protegida con requireAdmin (routes/index.ts) -- solo un Administrador llega hasta acá, así
// que "solo Administrador puede asignar el rol Administrador" ya queda cubierto sin lógica extra.
export async function cambiarRolUsuario(req:Request,res:Response){
  const {rol}=cambiarRolSchema.parse(req.body);
  const usuario=await container.cambiarRolUsuario.ejecutar(idParam(req),rol);
  res.json({id:usuario.props.id,rol:usuario.props.rol});
}
export async function eliminarPlanta(req:Request,res:Response){await container.eliminarPlanta.ejecutar(idParam(req)); res.status(204).send();}
export async function obtenerAuditoria(_req:Request,res:Response){const registros=await container.obtenerAuditoria.ejecutar(); res.json(registros);}
