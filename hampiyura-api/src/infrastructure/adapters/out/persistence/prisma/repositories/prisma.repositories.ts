import { PrismaClient } from '@prisma/client';
import { Usuario } from '../../../../../../domain/entities/usuario.entity';
import { Cultivo } from '../../../../../../domain/entities/cultivo.entity';
import { ValidacionContenido } from '../../../../../../domain/entities/validacion-contenido.entity';
import { TokenAccion } from '../../../../../../domain/entities/token-accion.entity';
import { Planta } from '../../../../../../domain/entities/planta.entity';
import { ParteUso } from '../../../../../../domain/entities/parte-uso.entity';
import { Uso } from '../../../../../../domain/entities/uso.entity';
import { Reporte } from '../../../../../../domain/entities/reporte.entity';
import { Publicacion } from '../../../../../../domain/entities/publicacion.entity';
import { Comentario } from '../../../../../../domain/entities/comentario.entity';
import { Valoracion } from '../../../../../../domain/entities/valoracion.entity';
import { Preparacion } from '../../../../../../domain/entities/preparacion.entity';
import { Producto } from '../../../../../../domain/entities/producto.entity';
import { EstadoConservacion } from '../../../../../../domain/entities/estado-conservacion.entity';
import { AccionConservacion } from '../../../../../../domain/entities/accion-conservacion.entity';
import { UbicacionCultivo } from '../../../../../../domain/entities/ubicacion-cultivo.entity';
import { Notificacion } from '../../../../../../domain/entities/notificacion.entity';
import { Consulta, ConsultaProps } from '../../../../../../domain/entities/consulta.entity';
import { MensajeConsulta } from '../../../../../../domain/entities/mensaje-consulta.entity';
import { UsuarioRepositoryPort } from '../../../../../../domain/ports/out/usuario.repository.port';
import { CultivoRepositoryPort } from '../../../../../../domain/ports/out/cultivo.repository.port';
import { ValidacionContenidoRepositoryPort } from '../../../../../../domain/ports/out/validacion-contenido.repository.port';
import { TokenAccionRepositoryPort } from '../../../../../../domain/ports/out/token-accion.repository.port';
import { PlantaRepositoryPort } from '../../../../../../domain/ports/out/planta.repository.port';
import { ParteUsoRepositoryPort } from '../../../../../../domain/ports/out/parte-uso.repository.port';
import { UsoRepositoryPort } from '../../../../../../domain/ports/out/uso.repository.port';
import { ReporteRepositoryPort } from '../../../../../../domain/ports/out/reporte.repository.port';
import { PublicacionRepositoryPort } from '../../../../../../domain/ports/out/publicacion.repository.port';
import { ComentarioRepositoryPort } from '../../../../../../domain/ports/out/comentario.repository.port';
import { ValoracionRepositoryPort } from '../../../../../../domain/ports/out/valoracion.repository.port';
import { PreparacionRepositoryPort } from '../../../../../../domain/ports/out/preparacion.repository.port';
import { ProductoRepositoryPort } from '../../../../../../domain/ports/out/producto.repository.port';
import { EstadoConservacionRepositoryPort } from '../../../../../../domain/ports/out/estado-conservacion.repository.port';
import { AccionConservacionRepositoryPort } from '../../../../../../domain/ports/out/accion-conservacion.repository.port';
import { MapaCultivoPort } from '../../../../../../domain/ports/out/mapa-cultivo.port';
import { NotificacionRepositoryPort } from '../../../../../../domain/ports/out/notificacion.repository.port';
import { ConsultaRepositoryPort, FiltrosBandejaConsultas } from '../../../../../../domain/ports/out/consulta.repository.port';
import { MensajeConsultaRepositoryPort } from '../../../../../../domain/ports/out/mensaje-consulta.repository.port';
import { Fuente } from '../../../../../../domain/value-objects/fuente.vo';
import { CalendarioCultivo } from '../../../../../../domain/value-objects/calendario-cultivo.vo';
import { TipoParte } from '../../../../../../domain/value-objects/tipo-parte.vo';
import { TipoConocimiento } from '../../../../../../domain/value-objects/tipo-conocimiento.vo';
import { EstadoValidacion } from '../../../../../../domain/value-objects/estado-validacion.vo';
import { NivelRiesgoConservacion } from '../../../../../../domain/value-objects/nivel-riesgo-conservacion.vo';
import { EstadoSeguimientoAccion } from '../../../../../../domain/value-objects/estado-seguimiento-accion.vo';
import { TipoConsulta } from '../../../../../../domain/value-objects/tipo-consulta.vo';
import { EstadoConsulta } from '../../../../../../domain/value-objects/estado-consulta.vo';
import { PrioridadConsulta } from '../../../../../../domain/value-objects/prioridad-consulta.vo';
import { AreaEspecialidad } from '../../../../../../domain/value-objects/area-especialidad.vo';

export class PrismaUsuarioRepository implements UsuarioRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  async buscarPorCorreo(correo:string){const x=await this.prisma.usuario.findUnique({where:{correo}}); return x?new Usuario({...x,rol:x.rol}):null;}
  async buscarPorId(id:string){const x=await this.prisma.usuario.findUnique({where:{id}}); return x?new Usuario({...x,rol:x.rol}):null;}
  async guardar(u:Usuario){await this.prisma.usuario.create({data:u.props as any});}
  async actualizar(u:Usuario){await this.prisma.usuario.update({where:{id:u.props.id},data:u.props as any});}
  async listar(){const xs=await this.prisma.usuario.findMany(); return xs.map(x=>new Usuario({...x,rol:x.rol}));}
  async contar(){return this.prisma.usuario.count();}
  async contarActivos(){return this.prisma.usuario.count({where:{estado:'Activo'}});}
}
export class PrismaCultivoRepository implements CultivoRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  private aDominio(x:any):Cultivo { const {mesesSiembra,mesesCosecha,fuente,...resto}=x; return new Cultivo({...resto, fuente:new Fuente(fuente), calendario:new CalendarioCultivo(mesesSiembra,mesesCosecha)}); }
  async guardar(c:Cultivo){ const {calendario,fuente,...resto}=c.props; await this.prisma.cultivo.create({data:{...resto, fuente:fuente.valor, mesesSiembra:calendario.mesesSiembra, mesesCosecha:calendario.mesesCosecha} as any}); }
  async buscarPorId(id:string){const x=await this.prisma.cultivo.findUnique({where:{id}}); return x?this.aDominio(x):null;}
  async listarPorPlanta(plantaId:string){const xs=await this.prisma.cultivo.findMany({where:{plantaId}}); return xs.map((x)=>this.aDominio(x));}
  async actualizarEstadoValidacion(id:string, estado:EstadoValidacion){await this.prisma.cultivo.update({where:{id},data:{estadoValidacion:estado}});}
}
export class PrismaValidacionRepository implements ValidacionContenidoRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  private aDominio(x:any):ValidacionContenido { return new ValidacionContenido({...x, comentarioValidador:x.comentarioValidador??undefined, validadorId:x.validadorId??undefined, estado:x.estado, fecha:x.fecha}); }
  async buscarPorId(id:string){const x=await this.prisma.validacionContenido.findUnique({where:{id}}); return x?this.aDominio(x):null;}
  async guardar(v:ValidacionContenido){await this.prisma.validacionContenido.upsert({where:{id:v.props.id},create:{...v.props,comentarioValidador:v.props.comentarioValidador} as any,update:{estado:v.props.estado,comentarioValidador:v.props.comentarioValidador,validadorId:v.props.validadorId,fecha:v.props.fecha}});}
  async listarPendientes(){const xs=await this.prisma.validacionContenido.findMany({where:{estado:'Pendiente'}}); return xs.map((x)=>this.aDominio(x));}
  async listar(){const xs=await this.prisma.validacionContenido.findMany(); return xs.map((x)=>this.aDominio(x));}
}
export class PrismaTokenAccionRepository implements TokenAccionRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  async guardar(t:TokenAccion){await this.prisma.tokenAccion.upsert({where:{id:t.props.id},create:t.props as any,update:{usado:t.props.usado}});}
  async buscarPorToken(token:string){const x=await this.prisma.tokenAccion.findUnique({where:{token}}); return x?new TokenAccion({...x,tipo:x.tipo}):null;}
}
export class PrismaPlantaRepository implements PlantaRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  async guardar(p:Planta){await this.prisma.planta.create({data:p.props as any});}
  async listar(){const xs=await this.prisma.planta.findMany(); return xs.map(x=>new Planta({...x,imagenPrincipal:x.imagenPrincipal??undefined}));}
  async buscarPorId(id:string){const x=await this.prisma.planta.findUnique({where:{id}}); return x?new Planta({...x,imagenPrincipal:x.imagenPrincipal??undefined}):null;}
  async eliminar(id:string){await this.prisma.planta.delete({where:{id}});}
  async contar(){return this.prisma.planta.count();}
  async actualizarEstadoValidacion(id:string, estado:EstadoValidacion){await this.prisma.planta.update({where:{id},data:{estadoValidacion:estado}});}
}
export class PrismaParteUsoRepository implements ParteUsoRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  private aDominio(x:any):ParteUso { return new ParteUso({...x, parte:x.parte as TipoParte, tipoConocimiento:x.tipoConocimiento as TipoConocimiento, preparacionId:x.preparacionId??undefined, contraindicaciones:x.contraindicaciones??undefined, fuente:new Fuente(x.fuente)}); }
  async guardar(p:ParteUso){await this.prisma.parteUso.create({data:{...p.props, fuente:p.props.fuente.valor} as any});}
  async buscarPorId(id:string){const x=await this.prisma.parteUso.findUnique({where:{id}}); return x?this.aDominio(x):null;}
  async listarPorPlanta(plantaId:string){const xs=await this.prisma.parteUso.findMany({where:{plantaId}}); return xs.map((x)=>this.aDominio(x));}
  async listarPorUso(usoId:string){const xs=await this.prisma.parteUso.findMany({where:{usoId}}); return xs.map((x)=>this.aDominio(x));}
  async actualizarEstadoValidacion(id:string, estado:EstadoValidacion){await this.prisma.parteUso.update({where:{id},data:{estadoValidacion:estado}});}
}
export class PrismaUsoRepository implements UsoRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  async guardar(u:Uso){await this.prisma.uso.create({data:u.props as any});}
  async listar(){const xs=await this.prisma.uso.findMany(); return xs.map(x=>new Uso({...x,descripcion:x.descripcion??undefined}));}
  async buscarPorId(id:string){const x=await this.prisma.uso.findUnique({where:{id}}); return x?new Uso({...x,descripcion:x.descripcion??undefined}):null;}
  async buscarPorNombre(nombre:string){const x=await this.prisma.uso.findUnique({where:{nombre}}); return x?new Uso({...x,descripcion:x.descripcion??undefined}):null;}
}
export class PrismaReporteRepository implements ReporteRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  async guardar(r:Reporte){await this.prisma.reporte.create({data:r.props as any});}
  async buscarPorId(id:string){const x=await this.prisma.reporte.findUnique({where:{id}}); return x?new Reporte({...x,estado:x.estado}):null;}
  async listarPendientes(){const xs=await this.prisma.reporte.findMany({where:{estado:'Pendiente'}}); return xs.map(x=>new Reporte({...x,estado:x.estado}));}
  async listarPorEstado(estado?:'Pendiente'|'Revisado'|'Desestimado'){const xs=await this.prisma.reporte.findMany({where:estado?{estado}:undefined,orderBy:{fecha:'desc'}}); return xs.map(x=>new Reporte({...x,estado:x.estado}));}
  async actualizar(r:Reporte){await this.prisma.reporte.update({where:{id:r.props.id},data:{estado:r.props.estado}});}
  async contarPorEstado(){
    const grupos=await this.prisma.reporte.groupBy({by:['estado'],_count:{estado:true}});
    const resultado={Pendiente:0,Revisado:0,Desestimado:0} as Record<string,number>;
    for (const g of grupos) resultado[g.estado]=g._count.estado;
    return resultado as any;
  }
}
export class PrismaPublicacionRepository implements PublicacionRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  private aDominio(x:any):Publicacion { return new Publicacion({...x, tipoConocimiento:x.tipoConocimiento as TipoConocimiento, fuente:new Fuente(x.fuente)}); }
  async guardar(p:Publicacion){await this.prisma.publicacion.create({data:{...p.props, fuente:p.props.fuente.valor} as any});}
  async buscarPorId(id:string){const x=await this.prisma.publicacion.findUnique({where:{id}}); return x?this.aDominio(x):null;}
  async listar(){const xs=await this.prisma.publicacion.findMany(); return xs.map((x)=>this.aDominio(x));}
  async actualizar(p:Publicacion){await this.prisma.publicacion.update({where:{id:p.props.id},data:{...p.props, fuente:p.props.fuente.valor} as any});}
  async eliminar(id:string){await this.prisma.publicacion.delete({where:{id}});}
  async actualizarEstadoValidacion(id:string, estado:EstadoValidacion){await this.prisma.publicacion.update({where:{id},data:{estadoValidacion:estado}});}
  async contar(){return this.prisma.publicacion.count();}
}
export class PrismaComentarioRepository implements ComentarioRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  private aDominio(x:any):Comentario { return new Comentario({...x, comentarioPadreId:x.comentarioPadreId??undefined}); }
  async guardar(c:Comentario){await this.prisma.comentario.create({data:{...c.props, comentarioPadreId:c.props.comentarioPadreId??null} as any});}
  async buscarPorId(id:string){const x=await this.prisma.comentario.findUnique({where:{id}}); return x?this.aDominio(x):null;}
  async listarPorPublicacion(publicacionId:string){const xs=await this.prisma.comentario.findMany({where:{publicacionId},orderBy:{fecha:'asc'}}); return xs.map((x)=>this.aDominio(x));}
}
export class PrismaValoracionRepository implements ValoracionRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  async guardar(v:Valoracion){await this.prisma.valoracion.create({data:v.props as any});}
  async actualizar(v:Valoracion){await this.prisma.valoracion.update({where:{id:v.props.id},data:{estrellas:v.props.estrellas}});}
  async buscarPorAutorYPublicacion(autorId:string, publicacionId:string){const x=await this.prisma.valoracion.findUnique({where:{publicacionId_autorId:{publicacionId,autorId}}}); return x?new Valoracion({...x}):null;}
  async listarPorPublicacion(publicacionId:string){const xs=await this.prisma.valoracion.findMany({where:{publicacionId}}); return xs.map((x)=>new Valoracion({...x}));}
}
export class PrismaPreparacionRepository implements PreparacionRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  private aDominio(x:any):Preparacion { return new Preparacion({...x, contraindicaciones:x.contraindicaciones??undefined, fuente:new Fuente(x.fuente)}); }
  async guardar(p:Preparacion){await this.prisma.preparacion.create({data:{...p.props, fuente:p.props.fuente.valor} as any});}
  async buscarPorId(id:string){const x=await this.prisma.preparacion.findUnique({where:{id}}); return x?this.aDominio(x):null;}
  async listarPorParteUso(parteUsoId:string){const xs=await this.prisma.preparacion.findMany({where:{parteUsoId}}); return xs.map((x)=>this.aDominio(x));}
  async actualizarEstadoValidacion(id:string, estado:EstadoValidacion){await this.prisma.preparacion.update({where:{id},data:{estadoValidacion:estado}});}
}
export class PrismaProductoRepository implements ProductoRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  private aDominio(x:any):Producto { return new Producto({...x, descripcion:x.descripcion??undefined, ingredientes:x.ingredientes??undefined, presentacion:x.presentacion??undefined, cantidad:x.cantidad??undefined, precioReferencial:x.precioReferencial??undefined, fechaElaboracion:x.fechaElaboracion??undefined, documentacionCertificacion:x.documentacionCertificacion??undefined, plantasUtilizadas:x.plantasUtilizadas??undefined, latitud:x.latitud??undefined, longitud:x.longitud??undefined}); }
  async guardar(p:Producto){await this.prisma.producto.create({data:p.props as any});}
  async buscarPorId(id:string){const x=await this.prisma.producto.findUnique({where:{id}}); return x?this.aDominio(x):null;}
  async listar(){const xs=await this.prisma.producto.findMany(); return xs.map((x)=>this.aDominio(x));}
  async actualizar(p:Producto){await this.prisma.producto.update({where:{id:p.props.id},data:p.props as any});}
  async actualizarEstadoValidacion(id:string, estado:EstadoValidacion){await this.prisma.producto.update({where:{id},data:{estadoValidacion:estado}});}
}
export class PrismaEstadoConservacionRepository implements EstadoConservacionRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  private aDominio(x:any):EstadoConservacion { return new EstadoConservacion({...x, nivelRiesgo:x.nivelRiesgo as NivelRiesgoConservacion, fuenteOficial:new Fuente(x.fuenteOficial)}); }
  async guardar(e:EstadoConservacion){await this.prisma.estadoConservacion.create({data:{...e.props, fuenteOficial:e.props.fuenteOficial.valor} as any});}
  async buscarPorId(id:string){const x=await this.prisma.estadoConservacion.findUnique({where:{id}}); return x?this.aDominio(x):null;}
  async buscarValidadoPorPlanta(plantaId:string){const x=await this.prisma.estadoConservacion.findFirst({where:{plantaId,estadoValidacion:'Validado'},orderBy:{fecha:'desc'}}); return x?this.aDominio(x):null;}
  async actualizarEstadoValidacion(id:string, estado:EstadoValidacion){await this.prisma.estadoConservacion.update({where:{id},data:{estadoValidacion:estado}});}
}
export class PrismaAccionConservacionRepository implements AccionConservacionRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  async guardar(a:AccionConservacion){await this.prisma.accionConservacion.create({data:a.props as any});}
  async listarPorPlanta(plantaId:string){const xs=await this.prisma.accionConservacion.findMany({where:{plantaId},orderBy:{fecha:'desc'}}); return xs.map(x=>new AccionConservacion({...x, estadoSeguimiento:x.estadoSeguimiento as EstadoSeguimientoAccion}));}
}
export class PrismaMapaCultivoRepository implements MapaCultivoPort {
  constructor(private readonly prisma:PrismaClient) {}
  async guardar(u:UbicacionCultivo){await this.prisma.ubicacionCultivo.create({data:u.props as any});}
  async obtenerUbicacion(cultivoId:string){const x=await this.prisma.ubicacionCultivo.findFirst({where:{cultivoId},orderBy:{fecha:'desc'}}); return x?new UbicacionCultivo(x):null;}
  async listarTodas(){const xs=await this.prisma.ubicacionCultivo.findMany({orderBy:{fecha:'desc'}}); return xs.map(x=>new UbicacionCultivo(x));}
}
export class PrismaNotificacionRepository implements NotificacionRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  async guardar(n:Notificacion){await this.prisma.notificacion.create({data:n.props as any});}
  async listarPorUsuario(usuarioId:string){const xs=await this.prisma.notificacion.findMany({where:{usuarioId},orderBy:{fecha:'desc'}}); return xs.map(x=>new Notificacion({...x, entidadTipo:x.entidadTipo??undefined, entidadId:x.entidadId??undefined}));}
  async marcarTodasLeidas(usuarioId:string){await this.prisma.notificacion.updateMany({where:{usuarioId,leida:false},data:{leida:true}});}
  async marcarLeida(id:string, usuarioId:string){await this.prisma.notificacion.updateMany({where:{id,usuarioId},data:{leida:true}});}
  async eliminarDeUsuario(id:string, usuarioId:string){await this.prisma.notificacion.deleteMany({where:{id,usuarioId}});}
}
export class PrismaConsultaRepository implements ConsultaRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  private aDominio(x:any):Consulta {
    return new Consulta({
      ...x,
      autorId: x.autorId ?? undefined,
      tipo: x.tipo as TipoConsulta,
      estado: x.estado as EstadoConsulta,
      prioridad: x.prioridad as PrioridadConsulta,
      areaAsignada: (x.areaAsignada ?? undefined) as AreaEspecialidad | undefined,
      asignadoA: x.asignadoA ?? undefined,
      fechaPrimeraRespuestaEquipo: x.fechaPrimeraRespuestaEquipo ?? undefined,
    } as ConsultaProps);
  }
  async guardar(c:Consulta){await this.prisma.consulta.create({data:c.props as any});}
  async buscarPorId(id:string){const x=await this.prisma.consulta.findUnique({where:{id}}); return x?this.aDominio(x):null;}
  async actualizar(c:Consulta){await this.prisma.consulta.update({where:{id:c.props.id},data:c.props as any});}
  async listar(filtros:FiltrosBandejaConsultas){
    const xs=await this.prisma.consulta.findMany({
      where:{...(filtros.tipo?{tipo:filtros.tipo}:{}), ...(filtros.estado?{estado:filtros.estado}:{}), ...(filtros.area?{areaAsignada:filtros.area}:{})},
      orderBy:[{prioridad:'desc'},{fechaCreacion:'asc'}],
    });
    return xs.map((x)=>this.aDominio(x));
  }
  async listarPorAutor(autorId:string){const xs=await this.prisma.consulta.findMany({where:{autorId},orderBy:{fechaCreacion:'desc'}}); return xs.map((x)=>this.aDominio(x));}
}
export class PrismaMensajeConsultaRepository implements MensajeConsultaRepositoryPort {
  constructor(private readonly prisma:PrismaClient) {}
  async guardar(m:MensajeConsulta){await this.prisma.mensajeConsulta.create({data:m.props as any});}
  async listarPorConsulta(consultaId:string){const xs=await this.prisma.mensajeConsulta.findMany({where:{consultaId},orderBy:{fecha:'asc'}}); return xs.map((x)=>new MensajeConsulta({...x}));}
}
