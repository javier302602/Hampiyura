import 'reflect-metadata';
import path from 'path';
import express from 'express'; import cors from 'cors';
import { router } from './infrastructure/adapters/in/http/routes'; import { env } from './infrastructure/config/env';
const app=express(); app.use(cors()); app.use(express.json({limit:'8mb'})); app.use('/uploads',express.static(path.join(process.cwd(),'uploads'))); app.use('/api',router); app.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{const message=error instanceof Error?error.message:'Error interno'; res.status(400).json({error:message});});
if(require.main===module) app.listen(env.port,()=>console.log(`HAMPIYURA API escuchando en ${env.port}`));
export { app };
