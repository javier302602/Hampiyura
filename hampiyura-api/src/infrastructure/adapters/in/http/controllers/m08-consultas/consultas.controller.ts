import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../../config/container';
import { AuthenticatedRequest } from '../../middlewares/role.middleware';
import { TIPOS_CONSULTA } from '../../../../../../domain/value-objects/tipo-consulta.vo';
import { ESTADOS_CONSULTA } from '../../../../../../domain/value-objects/estado-consulta.vo';
import { AREAS_ESPECIALIDAD } from '../../../../../../domain/value-objects/area-especialidad.vo';

function auth(req:Request) { return (req as AuthenticatedRequest).user; }
function id(req:Request):string { return String(req.params.id); }

// RF-263: un visitante sin cuenta puede enviar una consulta general -- esta ruta no exige sesión
// (attachUserIfPresent, mismo mecanismo ya usado en M-06), pero si hay sesión se adjunta autorId.
const crearSchema=z.object({tipo:z.enum(TIPOS_CONSULTA),descripcion:z.string().min(1)});
export async function crearConsulta(req:Request,res:Response){
  const input=crearSchema.parse(req.body);
  const autorId=(req as AuthenticatedRequest).user?.id;
  const consulta=await container.crearConsulta.ejecutar({...input, autorId});
  res.status(201).json(consulta.props);
}

const filtrosBandejaSchema=z.object({tipo:z.enum(TIPOS_CONSULTA).optional(),estado:z.enum(ESTADOS_CONSULTA).optional(),area:z.enum(AREAS_ESPECIALIDAD).optional()});
export async function listarBandejaConsultas(req:Request,res:Response){
  const filtros=filtrosBandejaSchema.parse({tipo:req.query.tipo,estado:req.query.estado,area:req.query.area});
  const consultas=await container.listarBandejaConsultas.ejecutar(auth(req).rol, filtros);
  res.json(consultas.map((c)=>c.props));
}

export async function listarMisConsultas(req:Request,res:Response){
  const consultas=await container.listarMisConsultas.ejecutar(auth(req).id);
  res.json(consultas.map((c)=>c.props));
}

export async function obtenerConsulta(req:Request,res:Response){
  const user=auth(req);
  const {consulta,mensajes}=await container.obtenerConsulta.ejecutar(id(req), user.id, user.rol);
  res.json({...consulta.props, mensajes:mensajes.map((m)=>m.props)});
}

const agregarMensajeSchema=z.object({contenido:z.string().min(1)});
export async function agregarMensajeConsulta(req:Request,res:Response){
  const input=agregarMensajeSchema.parse(req.body);
  const user=auth(req);
  const mensaje=await container.agregarMensajeConsulta.ejecutar({consultaId:id(req), autorId:user.id, rolAutor:user.rol, contenido:input.contenido});
  res.status(201).json(mensaje.props);
}

const cambiarEstadoSchema=z.object({accion:z.enum(['cerrar','reabrir'])});
export async function cambiarEstadoConsulta(req:Request,res:Response){
  const input=cambiarEstadoSchema.parse(req.body);
  const user=auth(req);
  const consulta=input.accion==='cerrar'
    ? await container.cerrarConsulta.ejecutar(id(req), user.id, user.rol)
    : await container.reabrirConsulta.ejecutar(id(req), user.id, user.rol);
  res.json(consulta.props);
}

const asignarSchema=z.object({especialistaId:z.string().min(1)});
export async function asignarConsulta(req:Request,res:Response){
  const input=asignarSchema.parse(req.body);
  const user=auth(req);
  const consulta=await container.asignarConsulta.ejecutar(id(req), input.especialistaId, user.id, user.rol);
  res.json(consulta.props);
}
