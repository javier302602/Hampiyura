import { Request, Response } from 'express';
import { container } from '../../../../../config/container';

function idParam(req:Request):string { return String(req.params.id); }

export async function obtenerPanel(_req:Request,res:Response){const panel=await container.obtenerPanelAdmin.ejecutar(); res.json(panel);}
export async function listarUsuarios(_req:Request,res:Response){
  const usuarios=await container.listarUsuarios.ejecutar();
  res.json(usuarios.map(u=>({id:u.props.id,nombre:u.props.nombre,correo:u.props.correo,estado:u.props.estado})));
}
export async function suspenderUsuario(req:Request,res:Response){const usuario=await container.suspenderUsuario.ejecutar(idParam(req)); res.json({id:usuario.props.id,estado:usuario.props.estado});}
export async function reactivarUsuario(req:Request,res:Response){const usuario=await container.reactivarUsuario.ejecutar(idParam(req)); res.json({id:usuario.props.id,estado:usuario.props.estado});}
export async function eliminarPlanta(req:Request,res:Response){await container.eliminarPlanta.ejecutar(idParam(req)); res.status(204).send();}
export async function obtenerAuditoria(_req:Request,res:Response){const registros=await container.obtenerAuditoria.ejecutar(); res.json(registros);}
