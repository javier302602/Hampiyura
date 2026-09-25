import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../../config/env';
export type AuthenticatedRequest=Request & {user:{id:string;rol:string}};
function autenticar(req:Request):{id:string;rol:string}{const header=req.header('authorization'); if(!header?.startsWith('Bearer ')) throw new Error('sin-token'); const payload=jwt.verify(header.slice(7),env.jwtSecret) as {sub:string;rol:string}; return {id:payload.sub,rol:payload.rol};}

// El JWT dura 1 día (ver cuentas.use-cases.ts) y el frontend guarda la sesión en localStorage: pasado
// ese día la UI seguía mostrándose "con sesión iniciada" mientras TODA acción autenticada (proponer
// planta, publicar producto, etc.) fallaba con un "Autenticación requerida"/"Token inválido"
// indistinguible de un bug. `code` es estable y legible por máquina para que el cliente pueda
// cerrar la sesión y avisar con claridad; `error` sigue siendo el texto para humanos.
function respuesta401(err:unknown){
  if((err as {name?:string})?.name==='TokenExpiredError') return {error:'Tu sesión expiró. Inicia sesión de nuevo para continuar.', code:'SESION_EXPIRADA'};
  if((err as Error)?.message==='sin-token') return {error:'Autenticación requerida', code:'SIN_SESION'};
  return {error:'Token inválido', code:'SESION_INVALIDA'};
}

export function requireAuth(req:Request,res:Response,next:NextFunction){try{(req as AuthenticatedRequest).user=autenticar(req); next();}catch(err){return res.status(401).json(respuesta401(err));}}
export function requireValidator(req:Request,res:Response,next:NextFunction){try{const user=autenticar(req); if(user.rol!=='Administrador'&&!user.rol.startsWith('Especialista')) return res.status(403).json({error:'Rol no autorizado'}); (req as AuthenticatedRequest).user=user; next();}catch(err){return res.status(401).json(respuesta401(err));}}
export function requireAdmin(req:Request,res:Response,next:NextFunction){try{const user=autenticar(req); if(user.rol!=='Administrador') return res.status(403).json({error:'Solo el administrador puede realizar esta acción'}); (req as AuthenticatedRequest).user=user; next();}catch(err){return res.status(401).json(respuesta401(err));}}
export function requireProductor(req:Request,res:Response,next:NextFunction){try{const user=autenticar(req); if(user.rol!=='Productor'&&user.rol!=='Administrador') return res.status(403).json({error:'Solo un Productor puede publicar productos'}); (req as AuthenticatedRequest).user=user; next();}catch(err){return res.status(401).json(respuesta401(err));}}
// Para endpoints públicos que igual quieren saber "¿quién pregunta?" cuando hay sesión (ej. para
// incluir "mi valoración" en la respuesta) sin exigir login. Nunca rechaza la petición.
export function attachUserIfPresent(req:Request,_res:Response,next:NextFunction){try{(req as AuthenticatedRequest).user=autenticar(req);}catch{/* sin sesión o token inválido: sigue como anónimo */} next();}
