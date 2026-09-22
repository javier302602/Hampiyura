import { Request, Response } from 'express';
import { z } from 'zod';
import { container } from '../../../../config/container';
import { AuthenticatedRequest } from '../middlewares/role.middleware';
// tipoRegistro decide rol/estado (ver RegistrarUsuarioUseCase) -- nunca se acepta un `rol` crudo
// del cliente, para que nadie pueda autoasignarse un rol arbitrario manipulando el body.
const registroSchema=z.object({nombre:z.string().min(1),correo:z.string().email(),contraseña:z.string().min(1),contraseñaConfirmacion:z.string().min(1),tipoRegistro:z.enum(['personal','empresa']).default('personal')});
export async function registrar(req:Request,res:Response){const input=registroSchema.parse(req.body); const u=await container.registrarUsuario.ejecutar(input); res.status(201).json({id:u.props.id,nombre:u.props.nombre,correo:u.props.correo,rol:u.props.rol,estado:u.props.estado});}
export async function login(req:Request,res:Response){const input=z.object({correo:z.string().email(),contraseña:z.string()}).parse(req.body); const r=await container.login.ejecutar(input.correo,input.contraseña); res.json({token:r.token,usuario:{id:r.usuario.props.id,correo:r.usuario.props.correo,rol:r.usuario.props.rol}});}
export async function activarCuenta(req:Request,res:Response){const input=z.object({token:z.string().min(1)}).parse(req.body); await container.activarCuenta.ejecutar(input.token); res.json({mensaje:'Cuenta activada correctamente'});}
export async function solicitarRecuperacion(req:Request,res:Response){const input=z.object({correo:z.string().email()}).parse(req.body); await container.solicitarRecuperacion.ejecutar(input.correo); res.json({mensaje:'Se envió un enlace de recuperación a tu correo'});}
export async function restablecerContraseña(req:Request,res:Response){const input=z.object({token:z.string().min(1),contraseñaNueva:z.string().min(1),confirmacion:z.string().min(1)}).parse(req.body); await container.restablecerContraseña.ejecutar(input.token,input.contraseñaNueva,input.confirmacion); res.json({mensaje:'Contraseña restablecida correctamente'});}
export async function cambiarContraseña(req:Request,res:Response){const input=z.object({contraseñaActual:z.string().min(1),contraseñaNueva:z.string().min(1),confirmacion:z.string().min(1)}).parse(req.body); const user=(req as AuthenticatedRequest).user; await container.cambiarContraseña.ejecutar(user.id,input.contraseñaActual,input.contraseñaNueva,input.confirmacion); res.json({mensaje:'Contraseña actualizada correctamente'});}
export async function obtenerPerfil(req:Request,res:Response){const perfil=await container.obtenerPerfil.ejecutar((req as AuthenticatedRequest).user.id); res.json(perfil);}
