import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { ConsultarAsistenteUseCase } from '../../application/m12-busqueda-recomendaciones/asistente.use-cases';
import { AnthropicModeloAdapter } from '../adapters/out/ia/anthropic-modelo.adapter';
import { SimuladoModeloAdapter } from '../adapters/out/ia/simulado-modelo.adapter';
import { LimitadorAsistente } from '../adapters/out/ia/limitador-asistente';
import { PrismaUsuarioRepository, PrismaCultivoRepository, PrismaValidacionRepository, PrismaTokenAccionRepository, PrismaPlantaRepository, PrismaParteUsoRepository, PrismaUsoRepository, PrismaReporteRepository, PrismaPublicacionRepository, PrismaComentarioRepository, PrismaValoracionRepository, PrismaPreparacionRepository, PrismaProductoRepository, PrismaEstadoConservacionRepository, PrismaAccionConservacionRepository, PrismaNotificacionRepository, PrismaConsultaRepository, PrismaMensajeConsultaRepository, PrismaMapaCultivoRepository } from '../adapters/out/persistence/prisma/repositories/prisma.repositories';
import { PersistenteNotificadorAdapter } from '../adapters/out/notifications/persistente-notificador.adapter';
import { ConsoleEmailAdapter } from '../adapters/out/email/console-email.adapter';
import { LocalAlmacenamientoMediaAdapter } from '../adapters/out/media/local-almacenamiento-media.adapter';
import { RegistrarUsuarioUseCase, LoginUseCase, ActivarCuentaUseCase, SolicitarRecuperacionContraseñaUseCase, RestablecerContraseñaUseCase, CambiarContraseñaUseCase, ObtenerPerfilUseCase, ActualizarPerfilUseCase } from '../../application/m01-cuentas/cuentas.use-cases';
import { RegistrarPlantaUseCase, ProponerPlantaUseCase, ListarPlantasUseCase, ObtenerPlantaUseCase } from '../../application/m02-catalogo-plantas/catalogo-plantas.use-cases';
import { RegistrarFichaCultivoUseCase } from '../../application/m03-cultivo/registrar-ficha-cultivo.use-case';
import { ObtenerFichaCultivoUseCase } from '../../application/m03-cultivo/obtener-ficha-cultivo.use-case';
import { ListarFichasCultivoUseCase } from '../../application/m03-cultivo/listar-fichas-cultivo.use-case';
import { RegistrarUbicacionCultivoUseCase } from '../../application/m03-cultivo/registrar-ubicacion-cultivo.use-case';
import { ObtenerUbicacionCultivoUseCase } from '../../application/m03-cultivo/obtener-ubicacion-cultivo.use-case';
import { ListarMapaCultivoUseCase } from '../../application/m03-cultivo/listar-mapa-cultivo.use-case';
import { RegistrarUsoUseCase, ListarUsosUseCase } from '../../application/m04-usos-partes/catalogo-usos.use-cases';
import { RegistrarParteUsoUseCase, ObtenerParteUsoUseCase, ListarPartesUsoUseCase } from '../../application/m04-usos-partes/partes-uso.use-cases';
import { AprobarContenidoUseCase, ObservarContenidoUseCase, RechazarContenidoUseCase, ListarPendientesUseCase } from '../../application/m09-validacion-moderacion/validacion.use-cases';
import { ListarSeguimientoUseCase, ObtenerSeguimientoUseCase, ActualizarContactoSeguimientoUseCase, RegistrarValidacionCientificaUseCase } from '../../application/m04-usos-partes/seguimiento-cientifico.use-cases';
import { SolicitarTipoCuentaUseCase, ObtenerMiTipoCuentaUseCase, SolicitudCuentaValidable } from '../../application/m01-cuentas/solicitud-tipo-cuenta.use-cases';
import { ActualizarGuiaCultivoUseCase } from '../../application/m03-cultivo/guia-cultivo.use-case';
import { tieneSoportePrioritario } from '../../domain/value-objects/plan.vo';
import { ObtenerDetalleValidacionUseCase } from '../../application/m09-validacion-moderacion/detalle-validacion.use-case';
import { MensajeriaUseCase } from '../../application/m15-planes/mensajeria.use-cases';
import { AlertasUseCase } from '../../application/m15-planes/alertas.use-cases';
import { ReporteBioeconomiaUseCase } from '../../application/m15-planes/reportes.use-cases';
import { ProductoresDisponiblesUseCase } from '../../application/m15-planes/productores-disponibles.use-cases';
import { PrismaMensajeriaRepository, PrismaAlertasRepository, PrismaDisponibilidadRepository, PrismaBusquedasRepository } from '../adapters/out/persistence/prisma/repositories/prisma.repositories-r30';
import { AccesoContactoService, ListarPlanesUseCase, MiPlanUseCase, SolicitarPagoUseCase, ListarPagosAdminUseCase, ResolverPagoUseCase, DirectorioProductoresUseCase, ProtegerContactoProductosUseCase } from '../../application/m15-planes/planes.use-cases';
import { PrismaPagoContactoRepository, PrismaSolicitudCuentaRepository } from '../adapters/out/persistence/prisma/repositories/prisma.repositories';
import { env as envM15 } from './env';
import { ReportarContenidoUseCase, ListarReportesPendientesUseCase, ListarReportesUseCase, ActualizarEstadoReporteUseCase } from '../../application/m09-validacion-moderacion/reportes.use-cases';
import { ListarUsuariosUseCase, SuspenderUsuarioUseCase, ReactivarUsuarioUseCase, CambiarRolUsuarioUseCase, EliminarPlantaUseCase, ObtenerPanelAdminUseCase, ObtenerAuditoriaUseCase } from '../../application/m13-analitica-estadisticas/administracion.use-cases';
import { ListarNotificacionesUseCase, MarcarTodasLeidasUseCase, MarcarLeidaUseCase, EliminarNotificacionUseCase } from '../../application/m14-seguridad-notificaciones/notificaciones.use-cases';
import { CrearPublicacionUseCase, ObtenerPublicacionUseCase, ListarPublicacionesUseCase, EditarPublicacionUseCase, EliminarPublicacionUseCase, SubirMediaUseCase } from '../../application/m06-publicaciones/publicaciones.use-cases';
import { ComentarPublicacionUseCase, ListarComentariosUseCase, CalificarPublicacionUseCase } from '../../application/m07-comunidad/comunidad.use-cases';
import { DocumentarPreparacionUseCase, ObtenerPreparacionUseCase, ListarPreparacionesUseCase } from '../../application/m05-preparaciones/preparaciones.use-cases';
import { PublicarProductoUseCase, ObtenerProductoUseCase, ListarProductosUseCase, MarcarValidadoDocumentalmenteUseCase, MarcarCertificadoUseCase, VerificarAfirmacionesUseCase } from '../../application/m11-productos-emprendimientos/productos.use-cases';
import { RegistrarEstadoConservacionUseCase, ObtenerEstadoConservacionUseCase, RegistrarAccionConservacionUseCase, ListarAccionesConservacionUseCase } from '../../application/m10-conservacion/conservacion.use-cases';
import { BuscarPlantasUseCase } from '../../application/m12-busqueda-recomendaciones/busqueda.use-cases';
import { CrearConsultaUseCase, ListarBandejaConsultasUseCase, ListarMisConsultasUseCase, ObtenerConsultaUseCase, AgregarMensajeConsultaUseCase, CerrarConsultaUseCase, ReabrirConsultaUseCase, CambiarEstadoConsultaEquipoUseCase, AsignarConsultaUseCase } from '../../application/m08-consultas/consultas.use-cases';
import { RegistroEntidadesValidables } from '../../domain/ports/out/entidad-validable.repository.port';
export const prisma=new PrismaClient();
const usuarios=new PrismaUsuarioRepository(prisma); const cultivos=new PrismaCultivoRepository(prisma); const validaciones=new PrismaValidacionRepository(prisma); const tokensAccion=new PrismaTokenAccionRepository(prisma); const plantas=new PrismaPlantaRepository(prisma); const partesUso=new PrismaParteUsoRepository(prisma); const usos=new PrismaUsoRepository(prisma); const reportes=new PrismaReporteRepository(prisma); const publicaciones=new PrismaPublicacionRepository(prisma); const comentarios=new PrismaComentarioRepository(prisma); const valoraciones=new PrismaValoracionRepository(prisma); const preparaciones=new PrismaPreparacionRepository(prisma); const productos=new PrismaProductoRepository(prisma); const estadosConservacion=new PrismaEstadoConservacionRepository(prisma); const accionesConservacion=new PrismaAccionConservacionRepository(prisma); const notificaciones=new PrismaNotificacionRepository(prisma); const consultas=new PrismaConsultaRepository(prisma); const mensajesConsulta=new PrismaMensajeConsultaRepository(prisma); const mapaCultivo=new PrismaMapaCultivoRepository(prisma);
// PersistenteNotificadorAdapter reemplaza a ConsoleNotificador (que no hacía nada, ni loguear):
// ahora cada notificar() persiste una fila real en Notificacion para el centro de notificaciones.
const notificador=new PersistenteNotificadorAdapter(notificaciones); const email=new ConsoleEmailAdapter(); const almacenamientoMedia=new LocalAlmacenamientoMediaAdapter();
// Registro de entidades que pasan por M-09: al aprobar/observar/rechazar una ValidacionContenido,
// su tipoEntidad decide a qué repositorio reflejar el nuevo estado (ver entidad-validable.repository.port.ts).
const registrarParteUsoUC=new RegistrarParteUsoUseCase(partesUso,usos,validaciones);
const pagosContacto=new PrismaPagoContactoRepository(prisma); const accesoContacto=new AccesoContactoService(pagosContacto);
const directorioProductores=new DirectorioProductoresUseCase(usuarios,mapaCultivo,cultivos,plantas,productos,accesoContacto);
const solicitudesCuenta=new PrismaSolicitudCuentaRepository(prisma);
// Ronda 30 (M-15): mensajería, alertas, reportes agregados y "Productores disponibles".
const busquedasRepo=new PrismaBusquedasRepository(prisma);
const mensajeria=new MensajeriaUseCase(new PrismaMensajeriaRepository(prisma),usuarios,accesoContacto,directorioProductores,notificador);
const alertas=new AlertasUseCase(new PrismaAlertasRepository(prisma),plantas,cultivos,productos,notificador,accesoContacto,usuarios);
const reporteBioeconomia=new ReporteBioeconomiaUseCase(usuarios,plantas,cultivos,productos,directorioProductores,busquedasRepo,accesoContacto);
const productoresDisponibles=new ProductoresDisponiblesUseCase(new PrismaDisponibilidadRepository(prisma),directorioProductores,accesoContacto);
const entidadesValidables:RegistroEntidadesValidables={ SolicitudCuenta:new SolicitudCuentaValidable(solicitudesCuenta,usuarios), Cultivo:cultivos, ParteUso:partesUso, Publicacion:publicaciones, Preparacion:preparaciones, Producto:productos, EstadoConservacion:estadosConservacion, Planta:plantas };
export const container={
  registrarUsuario:new RegistrarUsuarioUseCase(usuarios,tokensAccion,email),
  login:new LoginUseCase(usuarios,env.jwtSecret),
  activarCuenta:new ActivarCuentaUseCase(tokensAccion,usuarios),
  solicitarRecuperacion:new SolicitarRecuperacionContraseñaUseCase(usuarios,tokensAccion,email),
  restablecerContraseña:new RestablecerContraseñaUseCase(tokensAccion,usuarios),
  cambiarContraseña:new CambiarContraseñaUseCase(usuarios),
  // Asistente de IA: con ASISTENTE_API_KEY usa el proveedor real; sin ella, modo simulado (sin red ni costo).
  consultarAsistente:new ConsultarAsistenteUseCase(plantas,partesUso,usos,cultivos,env.asistente.apiKey?new AnthropicModeloAdapter(env.asistente.apiKey,env.asistente.modelo):new SimuladoModeloAdapter()),
  limitadorAsistente:new LimitadorAsistente(env.asistente.limitePorMinuto,env.asistente.limitePorDia),
  obtenerPerfil:new ObtenerPerfilUseCase(usuarios),
  solicitarTipoCuenta:new SolicitarTipoCuentaUseCase(solicitudesCuenta,validaciones,usuarios),
  obtenerMiTipoCuenta:new ObtenerMiTipoCuentaUseCase(solicitudesCuenta,validaciones,usuarios),
  registrarPlanta:new RegistrarPlantaUseCase(plantas),
  proponerPlanta:new ProponerPlantaUseCase(plantas,validaciones,registrarParteUsoUC,usos),
  listarPlantas:new ListarPlantasUseCase(plantas),
  obtenerPlanta:new ObtenerPlantaUseCase(plantas,estadosConservacion),
  registrarCultivo:new RegistrarFichaCultivoUseCase(cultivos,validaciones),
  obtenerFichaCultivo:new ObtenerFichaCultivoUseCase(cultivos),
  actualizarGuiaCultivo:new ActualizarGuiaCultivoUseCase(cultivos),
  listarFichasCultivo:new ListarFichasCultivoUseCase(cultivos),
  registrarUbicacionCultivo:new RegistrarUbicacionCultivoUseCase(mapaCultivo,cultivos,estadosConservacion,plantas),
  obtenerUbicacionCultivo:new ObtenerUbicacionCultivoUseCase(mapaCultivo),
  listarMapaCultivo:new ListarMapaCultivoUseCase(mapaCultivo,plantas,cultivos,estadosConservacion,usuarios),
  registrarUso:new RegistrarUsoUseCase(usos),
  listarUsos:new ListarUsosUseCase(usos),
  registrarParteUso:registrarParteUsoUC,
  obtenerParteUso:new ObtenerParteUsoUseCase(partesUso),
  listarPartesUso:new ListarPartesUsoUseCase(partesUso),
  aprobar:new AprobarContenidoUseCase(validaciones,notificador,entidadesValidables),
  observar:new ObservarContenidoUseCase(validaciones,notificador,entidadesValidables),
  rechazar:new RechazarContenidoUseCase(validaciones,notificador,entidadesValidables),
  obtenerDetalleValidacion:new ObtenerDetalleValidacionUseCase(validaciones,usuarios,plantas,partesUso,usos,publicaciones,preparaciones,productos,estadosConservacion,cultivos,solicitudesCuenta),
  listarSeguimiento:new ListarSeguimientoUseCase(partesUso,plantas,usos,usuarios),
  obtenerSeguimiento:new ObtenerSeguimientoUseCase(partesUso,plantas,usos,usuarios),
  actualizarContactoSeguimiento:new ActualizarContactoSeguimientoUseCase(partesUso,plantas,usos,usuarios),
  registrarValidacionCientifica:new RegistrarValidacionCientificaUseCase(partesUso,plantas,usos,usuarios,notificador),
  listarPlanes:new ListarPlanesUseCase(pagosContacto,envM15.cobro),
  miPlan:new MiPlanUseCase(pagosContacto,usuarios,accesoContacto),
  solicitarPago:new SolicitarPagoUseCase(pagosContacto,directorioProductores,accesoContacto),
  listarPagosAdmin:new ListarPagosAdminUseCase(pagosContacto,usuarios),
  resolverPago:new ResolverPagoUseCase(pagosContacto,notificador,accesoContacto),
  directorioProductores,
  mensajeria, alertas, reporteBioeconomia, productoresDisponibles,
  protegerContactoProductos:new ProtegerContactoProductosUseCase(accesoContacto),
  actualizarPerfil:new ActualizarPerfilUseCase(usuarios),
  listarPendientes:new ListarPendientesUseCase(validaciones,publicaciones,usuarios,preparaciones,partesUso,productos,estadosConservacion,plantas,cultivos,solicitudesCuenta),
  reportar:new ReportarContenidoUseCase(reportes),
  listarReportesPendientes:new ListarReportesPendientesUseCase(reportes),
  listarReportes:new ListarReportesUseCase(reportes,usuarios,comentarios),
  actualizarEstadoReporte:new ActualizarEstadoReporteUseCase(reportes),
  listarUsuarios:new ListarUsuariosUseCase(usuarios),
  suspenderUsuario:new SuspenderUsuarioUseCase(usuarios),
  reactivarUsuario:new ReactivarUsuarioUseCase(usuarios),
  cambiarRolUsuario:new CambiarRolUsuarioUseCase(usuarios),
  eliminarPlanta:new EliminarPlantaUseCase(plantas,cultivos,partesUso),
  obtenerPanelAdmin:new ObtenerPanelAdminUseCase(validaciones,usuarios,plantas,publicaciones,reportes,consultas,pagosContacto,productos),
  obtenerAuditoria:new ObtenerAuditoriaUseCase(validaciones),
  crearPublicacion:new CrearPublicacionUseCase(publicaciones,plantas,validaciones),
  obtenerPublicacion:new ObtenerPublicacionUseCase(publicaciones,valoraciones,usuarios,comentarios),
  listarPublicaciones:new ListarPublicacionesUseCase(publicaciones,valoraciones,usuarios,comentarios),
  editarPublicacion:new EditarPublicacionUseCase(publicaciones,validaciones),
  eliminarPublicacion:new EliminarPublicacionUseCase(publicaciones,notificador),
  subirMedia:new SubirMediaUseCase(almacenamientoMedia),
  comentarPublicacion:new ComentarPublicacionUseCase(comentarios,publicaciones,notificador),
  listarComentarios:new ListarComentariosUseCase(comentarios,usuarios),
  calificarPublicacion:new CalificarPublicacionUseCase(valoraciones,publicaciones,notificador),
  listarNotificaciones:new ListarNotificacionesUseCase(notificaciones),
  marcarTodasLeidas:new MarcarTodasLeidasUseCase(notificaciones),
  marcarLeida:new MarcarLeidaUseCase(notificaciones),
  eliminarNotificacion:new EliminarNotificacionUseCase(notificaciones),
  documentarPreparacion:new DocumentarPreparacionUseCase(preparaciones,partesUso,validaciones),
  obtenerPreparacion:new ObtenerPreparacionUseCase(preparaciones),
  listarPreparaciones:new ListarPreparacionesUseCase(preparaciones),
  publicarProducto:new PublicarProductoUseCase(productos,plantas,validaciones,usuarios,usos),
  obtenerProducto:new ObtenerProductoUseCase(productos,plantas,usuarios),
  listarProductos:new ListarProductosUseCase(productos,plantas,usuarios),
  marcarValidadoDocumentalmente:new MarcarValidadoDocumentalmenteUseCase(productos),
  marcarCertificado:new MarcarCertificadoUseCase(productos),
  verificarAfirmaciones:new VerificarAfirmacionesUseCase(),
  registrarEstadoConservacion:new RegistrarEstadoConservacionUseCase(estadosConservacion,plantas,validaciones),
  obtenerEstadoConservacion:new ObtenerEstadoConservacionUseCase(estadosConservacion),
  registrarAccionConservacion:new RegistrarAccionConservacionUseCase(accionesConservacion,plantas),
  listarAccionesConservacion:new ListarAccionesConservacionUseCase(accionesConservacion),
  buscarPlantas:new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos,busquedasRepo),
  crearConsulta:new CrearConsultaUseCase(consultas,async (usuarioId)=>tieneSoportePrioritario((await accesoContacto.planActivo(usuarioId)).plan)),
  listarBandejaConsultas:new ListarBandejaConsultasUseCase(consultas),
  listarMisConsultas:new ListarMisConsultasUseCase(consultas,usuarios),
  obtenerConsulta:new ObtenerConsultaUseCase(consultas,mensajesConsulta),
  agregarMensajeConsulta:new AgregarMensajeConsultaUseCase(consultas,mensajesConsulta,notificador),
  cerrarConsulta:new CerrarConsultaUseCase(consultas),
  reabrirConsulta:new ReabrirConsultaUseCase(consultas),
  cambiarEstadoConsultaEquipo:new CambiarEstadoConsultaEquipoUseCase(consultas, notificador),
  asignarConsulta:new AsignarConsultaUseCase(consultas,usuarios),
};
