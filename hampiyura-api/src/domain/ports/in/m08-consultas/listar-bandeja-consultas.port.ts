import { Consulta } from '../../../entities/consulta.entity';
import { FiltrosBandejaConsultas } from '../../out/consulta.repository.port';

// RF-264: solo administrador/especialista. Un especialista solo ve consultas de su propia área
// (o sin área asignada, para poder triarlas) -- mismo principio de "no actuar fuera de su área"
// que RN-05 (M-09), aplicado aquí porque el usuario lo pidió explícitamente para este módulo.
export interface ListarBandejaConsultasPort { ejecutar(rolSolicitante: string, filtros: FiltrosBandejaConsultas): Promise<Consulta[]>; }
