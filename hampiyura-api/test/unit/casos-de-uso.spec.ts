import { Fuente } from '../../src/domain/value-objects/fuente.vo';
import { CalendarioCultivo } from '../../src/domain/value-objects/calendario-cultivo.vo';
import { RegistrarFichaCultivoUseCase } from '../../src/application/m03-cultivo/registrar-ficha-cultivo.use-case';
import { ObtenerFichaCultivoUseCase } from '../../src/application/m03-cultivo/obtener-ficha-cultivo.use-case';
import { ListarFichasCultivoUseCase } from '../../src/application/m03-cultivo/listar-fichas-cultivo.use-case';
import { AprobarContenidoUseCase, ObservarContenidoUseCase, RechazarContenidoUseCase, ListarPendientesUseCase } from '../../src/application/m09-validacion-moderacion/validacion.use-cases';
import { ReportarContenidoUseCase, ListarReportesPendientesUseCase, ActualizarEstadoReporteUseCase } from '../../src/application/m09-validacion-moderacion/reportes.use-cases';
import { ListarUsuariosUseCase, SuspenderUsuarioUseCase, ReactivarUsuarioUseCase, EliminarPlantaUseCase, ObtenerPanelAdminUseCase, ObtenerAuditoriaUseCase } from '../../src/application/m13-analitica-estadisticas/administracion.use-cases';
import { ListarNotificacionesUseCase, MarcarTodasLeidasUseCase, MarcarLeidaUseCase, EliminarNotificacionUseCase } from '../../src/application/m14-seguridad-notificaciones/notificaciones.use-cases';
import { Notificacion } from '../../src/domain/entities/notificacion.entity';
import { PersistenteNotificadorAdapter } from '../../src/infrastructure/adapters/out/notifications/persistente-notificador.adapter';
import { Reporte } from '../../src/domain/entities/reporte.entity';
import { Planta } from '../../src/domain/entities/planta.entity';
import { RegistrarUsoUseCase, ListarUsosUseCase } from '../../src/application/m04-usos-partes/catalogo-usos.use-cases';
import { RegistrarParteUsoUseCase, ObtenerParteUsoUseCase, ListarPartesUsoUseCase } from '../../src/application/m04-usos-partes/partes-uso.use-cases';
import { ValidacionContenido } from '../../src/domain/entities/validacion-contenido.entity';
import { Cultivo } from '../../src/domain/entities/cultivo.entity';
import { ParteUso } from '../../src/domain/entities/parte-uso.entity';
import { Uso } from '../../src/domain/entities/uso.entity';
import { RegistrarUsuarioUseCase, LoginUseCase, ActivarCuentaUseCase, SolicitarRecuperacionContraseñaUseCase, RestablecerContraseñaUseCase, CambiarContraseñaUseCase, ObtenerPerfilUseCase } from '../../src/application/m01-cuentas/cuentas.use-cases';
import { RegistrarPlantaUseCase, ListarPlantasUseCase, ObtenerPlantaUseCase } from '../../src/application/m02-catalogo-plantas/catalogo-plantas.use-cases';
import { TokenAccion } from '../../src/domain/entities/token-accion.entity';
import { Usuario } from '../../src/domain/entities/usuario.entity';
import { CrearPublicacionUseCase, ObtenerPublicacionUseCase, ListarPublicacionesUseCase, EditarPublicacionUseCase, EliminarPublicacionUseCase, SubirMediaUseCase } from '../../src/application/m06-publicaciones/publicaciones.use-cases';
import { ComentarPublicacionUseCase, ListarComentariosUseCase, CalificarPublicacionUseCase } from '../../src/application/m07-comunidad/comunidad.use-cases';
import { Publicacion } from '../../src/domain/entities/publicacion.entity';
import { Comentario } from '../../src/domain/entities/comentario.entity';
import { Valoracion } from '../../src/domain/entities/valoracion.entity';
import { DocumentarPreparacionUseCase, ObtenerPreparacionUseCase, ListarPreparacionesUseCase } from '../../src/application/m05-preparaciones/preparaciones.use-cases';
import { PublicarProductoUseCase, ObtenerProductoUseCase, ListarProductosUseCase, MarcarValidadoDocumentalmenteUseCase, MarcarCertificadoUseCase } from '../../src/application/m11-productos-emprendimientos/productos.use-cases';
import { Preparacion } from '../../src/domain/entities/preparacion.entity';
import { Producto } from '../../src/domain/entities/producto.entity';
import { RegistrarEstadoConservacionUseCase, ObtenerEstadoConservacionUseCase, RegistrarAccionConservacionUseCase, ListarAccionesConservacionUseCase } from '../../src/application/m10-conservacion/conservacion.use-cases';
import { EstadoConservacion } from '../../src/domain/entities/estado-conservacion.entity';
import { AccionConservacion } from '../../src/domain/entities/accion-conservacion.entity';
import { RegistrarUbicacionCultivoUseCase } from '../../src/application/m03-cultivo/registrar-ubicacion-cultivo.use-case';
import { ListarMapaCultivoUseCase } from '../../src/application/m03-cultivo/listar-mapa-cultivo.use-case';
import { UbicacionCultivo } from '../../src/domain/entities/ubicacion-cultivo.entity';
import { BuscarPlantasUseCase } from '../../src/application/m12-busqueda-recomendaciones/busqueda.use-cases';
import { CrearConsultaUseCase, ListarBandejaConsultasUseCase, ListarMisConsultasUseCase, ObtenerConsultaUseCase, AgregarMensajeConsultaUseCase, CerrarConsultaUseCase, ReabrirConsultaUseCase, AsignarConsultaUseCase } from '../../src/application/m08-consultas/consultas.use-cases';
import { Consulta } from '../../src/domain/entities/consulta.entity';
import { MensajeConsulta } from '../../src/domain/entities/mensaje-consulta.entity';

const cultivoInput:any={plantaId:'p1',autorId:'u1',zonaCultivo:'dato de prueba',condicionesClimaticas:'dato de prueba',tipoSuelo:'dato de prueba',altitudAprox:'dato de prueba',aguaNecesaria:'dato de prueba',exposicionSolar:'dato de prueba',epocaSiembra:'dato de prueba',metodoPropagacion:'dato de prueba',tiempoCrecimiento:'dato de prueba',cuidados:'dato de prueba',plagasComunes:'dato de prueba',epocaCosecha:'dato de prueba',recomendacionesSobreexplotacion:'dato de prueba',consejosRecoleccion:'dato de prueba',calendario:new CalendarioCultivo([9,10],[3,4]),fuente:new Fuente('fuente de prueba')};

describe('M-03 · Cultivo', () => {
  test('registra ficha de cultivo con fuente y la deja pendiente de revisión en M-09', async () => {
    const repo:any={guardar:jest.fn()};
    const validaciones:any={guardar:jest.fn()};
    const result=await new RegistrarFichaCultivoUseCase(repo,validaciones).ejecutar(cultivoInput);
    expect(repo.guardar).toHaveBeenCalled();
    expect(result.props.estadoValidacion).toBe('Pendiente');
    expect(validaciones.guardar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({tipoEntidad:'Cultivo',entidadId:result.props.id,estado:'Pendiente'})}));
  });

  function cultivo(overrides:Partial<Cultivo['props']> = {}) { return new Cultivo({id:'c1',...cultivoInput,...overrides}); }

  test('oculta los datos agronómicos si la ficha no está validada (RF-251)', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(cultivo({estadoValidacion:'Pendiente'}))};
    const ficha=await new ObtenerFichaCultivoUseCase(repo).ejecutar('c1');
    expect(ficha.disponible).toBe(false);
    if (!ficha.disponible) expect(ficha.mensaje).toMatch(/pendiente de validación/i);
  });

  test('muestra los datos agronómicos una vez validada la ficha', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(cultivo({estadoValidacion:'Validado'}))};
    const ficha=await new ObtenerFichaCultivoUseCase(repo).ejecutar('c1');
    expect(ficha.disponible).toBe(true);
    if (ficha.disponible) expect(ficha.consejosRecoleccion).toBe('dato de prueba');
  });

  test('lista las fichas de cultivo de una planta aplicando la misma máscara', async () => {
    const repo:any={listarPorPlanta:jest.fn().mockResolvedValue([cultivo({estadoValidacion:'Pendiente'}),cultivo({id:'c2',estadoValidacion:'Validado'})])};
    const fichas=await new ListarFichasCultivoUseCase(repo).ejecutar('p1');
    expect(fichas).toHaveLength(2);
    expect(fichas[0].disponible).toBe(false);
    expect(fichas[1].disponible).toBe(true);
  });
});

function usuarioActivo(overrides:Partial<Usuario['props']> = {}) { return new Usuario({id:'u1',nombre:'Dato de prueba',correo:'test@example.com',contraseñaHash:'',rol:'UsuarioRegistrado',idioma:'es',nivelConocimiento:'Pendiente',region:'Pendiente',estado:'Activo',...overrides}); }

describe('M-01 · Cuentas', () => {
  test('CG-005: el registro personal deja la cuenta Activo de inmediato, sin token de activación', async () => {
    const repo:any={buscarPorCorreo:jest.fn().mockResolvedValue(null),guardar:jest.fn()};
    const tokens:any={guardar:jest.fn()};
    const email:any={enviarActivacion:jest.fn(),enviarRecuperacion:jest.fn()};
    const useCase=new RegistrarUsuarioUseCase(repo,tokens,email);
    const usuario=await useCase.ejecutar({nombre:'Dato de prueba',correo:'test@example.com',contraseña:'password123',contraseñaConfirmacion:'password123'});
    expect(repo.guardar).toHaveBeenCalled();
    expect(usuario.props.rol).toBe('UsuarioRegistrado');
    expect(usuario.props.estado).toBe('Activo');
    expect(tokens.guardar).not.toHaveBeenCalled();
    expect(email.enviarActivacion).not.toHaveBeenCalled();
  });

  // El token de activación (reservado desde CG-005 para "un futuro tipo de cuenta con beneficios,
  // aún sin definir") ahora es exactamente el registro de empresa/emprendimiento: rol Productor,
  // PendienteActivacion hasta usar el token que llega por email (log de consola en desarrollo).
  test('registro de empresa (tipoRegistro:"empresa") crea un Productor PendienteActivacion, con token', async () => {
    const repo:any={buscarPorCorreo:jest.fn().mockResolvedValue(null),guardar:jest.fn()};
    const tokens:any={guardar:jest.fn()};
    const email:any={enviarActivacion:jest.fn(),enviarRecuperacion:jest.fn()};
    const useCase=new RegistrarUsuarioUseCase(repo,tokens,email);
    const usuario=await useCase.ejecutar({nombre:'Emprendimiento de prueba',correo:'empresa@example.com',contraseña:'password123',contraseñaConfirmacion:'password123',tipoRegistro:'empresa'});
    expect(repo.guardar).toHaveBeenCalled();
    expect(usuario.props.rol).toBe('Productor');
    expect(usuario.props.estado).toBe('PendienteActivacion');
    expect(tokens.guardar).toHaveBeenCalled();
    expect(email.enviarActivacion).toHaveBeenCalledWith('empresa@example.com', expect.any(String));
  });

  test('registro falla si la confirmación de contraseña no coincide', async () => {
    const repo:any={buscarPorCorreo:jest.fn().mockResolvedValue(null),guardar:jest.fn()};
    const tokens:any={guardar:jest.fn()}; const email:any={enviarActivacion:jest.fn(),enviarRecuperacion:jest.fn()};
    await expect(new RegistrarUsuarioUseCase(repo,tokens,email).ejecutar({nombre:'Dato de prueba',correo:'test@example.com',contraseña:'password123',contraseñaConfirmacion:'otra123'})).rejects.toThrow();
  });

  test('registro falla si la contraseña no es segura (sin números)', async () => {
    const repo:any={buscarPorCorreo:jest.fn().mockResolvedValue(null),guardar:jest.fn()};
    const tokens:any={guardar:jest.fn()}; const email:any={enviarActivacion:jest.fn(),enviarRecuperacion:jest.fn()};
    await expect(new RegistrarUsuarioUseCase(repo,tokens,email).ejecutar({nombre:'Dato de prueba',correo:'test@example.com',contraseña:'passwordabc',contraseñaConfirmacion:'passwordabc'})).rejects.toThrow();
  });

  test('login rechaza cuentas no activadas', async () => {
    const bcrypt=require('bcrypt');
    const usuario=usuarioActivo({estado:'PendienteActivacion', contraseñaHash:await bcrypt.hash('password123',10)});
    const repo:any={buscarPorCorreo:jest.fn().mockResolvedValue(usuario)};
    await expect(new LoginUseCase(repo,'test-secret').ejecutar('test@example.com','password123')).rejects.toThrow();
  });

  test('login exitoso emite token para cuentas activas', async () => {
    const bcrypt=require('bcrypt');
    const usuario=usuarioActivo({contraseñaHash:await bcrypt.hash('password123',10)});
    const repo:any={buscarPorCorreo:jest.fn().mockResolvedValue(usuario)};
    const result=await new LoginUseCase(repo,'test-secret').ejecutar('test@example.com','password123');
    expect(result.token).toBeTruthy();
  });

  test('activa la cuenta con un token vigente', async () => {
    const registro=new TokenAccion({id:'t1',usuarioId:'u1',tipo:'Activacion',token:'abc',expiracion:new Date(Date.now()+60000),usado:false});
    const usuario=usuarioActivo({estado:'PendienteActivacion'});
    const tokens:any={buscarPorToken:jest.fn().mockResolvedValue(registro),guardar:jest.fn()};
    const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(usuario),actualizar:jest.fn()};
    await new ActivarCuentaUseCase(tokens,usuarios).ejecutar('abc');
    expect(usuarios.actualizar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({estado:'Activo'})}));
    expect(tokens.guardar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({usado:true})}));
  });

  test('rechaza activación con token vencido', async () => {
    const registro=new TokenAccion({id:'t1',usuarioId:'u1',tipo:'Activacion',token:'abc',expiracion:new Date(Date.now()-60000),usado:false});
    const tokens:any={buscarPorToken:jest.fn().mockResolvedValue(registro),guardar:jest.fn()};
    const usuarios:any={buscarPorId:jest.fn(),actualizar:jest.fn()};
    await expect(new ActivarCuentaUseCase(tokens,usuarios).ejecutar('abc')).rejects.toThrow();
  });

  test('solicita recuperación de contraseña y notifica por correo', async () => {
    const usuario=usuarioActivo();
    const usuarios:any={buscarPorCorreo:jest.fn().mockResolvedValue(usuario)};
    const tokens:any={guardar:jest.fn()};
    const email:any={enviarActivacion:jest.fn(),enviarRecuperacion:jest.fn()};
    await new SolicitarRecuperacionContraseñaUseCase(usuarios,tokens,email).ejecutar('test@example.com');
    expect(tokens.guardar).toHaveBeenCalled();
    expect(email.enviarRecuperacion).toHaveBeenCalledWith('test@example.com', expect.any(String));
  });

  test('restablece la contraseña con un token de recuperación vigente', async () => {
    const registro=new TokenAccion({id:'t1',usuarioId:'u1',tipo:'RecuperacionContrasena',token:'abc',expiracion:new Date(Date.now()+15*60000),usado:false});
    const usuario=usuarioActivo();
    const tokens:any={buscarPorToken:jest.fn().mockResolvedValue(registro),guardar:jest.fn()};
    const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(usuario),actualizar:jest.fn()};
    await new RestablecerContraseñaUseCase(tokens,usuarios).ejecutar('abc','nuevaClave123','nuevaClave123');
    expect(usuarios.actualizar).toHaveBeenCalled();
    expect(tokens.guardar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({usado:true})}));
  });

  test('cambia la contraseña desde el perfil verificando la actual', async () => {
    const bcrypt=require('bcrypt');
    const usuario=usuarioActivo({contraseñaHash:await bcrypt.hash('actual123',10)});
    const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(usuario),actualizar:jest.fn()};
    await new CambiarContraseñaUseCase(usuarios).ejecutar('u1','actual123','nuevaClave123','nuevaClave123');
    expect(usuarios.actualizar).toHaveBeenCalled();
  });

  test('rechaza el cambio de contraseña si la actual no coincide', async () => {
    const bcrypt=require('bcrypt');
    const usuario=usuarioActivo({contraseñaHash:await bcrypt.hash('actual123',10)});
    const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(usuario),actualizar:jest.fn()};
    await expect(new CambiarContraseñaUseCase(usuarios).ejecutar('u1','incorrecta','nuevaClave123','nuevaClave123')).rejects.toThrow();
  });

  test('obtiene el perfil propio sin exponer el hash de la contraseña', async () => {
    const usuario=usuarioActivo({contraseñaHash:'hash-secreto'});
    const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(usuario)};
    const perfil=await new ObtenerPerfilUseCase(usuarios).ejecutar('u1');
    expect(perfil).not.toHaveProperty('contraseñaHash');
    expect(perfil.correo).toBe('test@example.com');
  });
});

describe('M-02 · Catálogo de plantas', () => {
  const plantaInput:any={nombreComun:'[DATO DE PRUEBA] Planta de ejemplo',nombreCientifico:'Testus exampleus',familia:'Familia de prueba',region:'Región de prueba',habitat:'Hábitat de prueba'};
  test('registra una planta en el catálogo', async () => {
    const repo:any={guardar:jest.fn(),listar:jest.fn(),buscarPorId:jest.fn()};
    const planta=await new RegistrarPlantaUseCase(repo).ejecutar(plantaInput);
    expect(repo.guardar).toHaveBeenCalled();
    expect(planta.props.nombreComun).toBe(plantaInput.nombreComun);
  });
  test('rechaza el registro sin nombre científico', async () => {
    const repo:any={guardar:jest.fn(),listar:jest.fn(),buscarPorId:jest.fn()};
    await expect(new RegistrarPlantaUseCase(repo).ejecutar({...plantaInput,nombreCientifico:''})).rejects.toThrow();
  });
  test('lista el catálogo de plantas', async () => {
    const repo:any={guardar:jest.fn(),listar:jest.fn().mockResolvedValue([{props:plantaInput}]),buscarPorId:jest.fn()};
    const plantas=await new ListarPlantasUseCase(repo).ejecutar();
    expect(plantas).toHaveLength(1);
  });
  test('obtiene el detalle de una planta por id, enriquecida con el resumen de conservación (RF-269)', async () => {
    const repo:any={guardar:jest.fn(),listar:jest.fn(),buscarPorId:jest.fn().mockResolvedValue({props:{...plantaInput,id:'p1'}})};
    const estadosConservacion:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(null)};
    const planta=await new ObtenerPlantaUseCase(repo,estadosConservacion).ejecutar('p1');
    expect(planta.id).toBe('p1');
    expect(planta.conservacion.disponible).toBe(false);
    expect((planta.conservacion as any).mensaje).toMatch(/no determinado/i);
  });
  test('lanza NotFoundError si la planta no existe', async () => {
    const repo:any={guardar:jest.fn(),listar:jest.fn(),buscarPorId:jest.fn().mockResolvedValue(null)};
    const estadosConservacion:any={buscarValidadoPorPlanta:jest.fn()};
    await expect(new ObtenerPlantaUseCase(repo,estadosConservacion).ejecutar('inexistente')).rejects.toThrow();
  });
});

describe('M-04 · Usos y Partes Curativas', () => {
  const parteUsoInput:any={plantaId:'p1',autorId:'u1',parte:'Hoja',usoId:'uso1',tipoConocimiento:'Tradicional',fuente:new Fuente('fuente de prueba')};

  describe('regla de verificación (ParteUso.puedeMostrarseComoVerificado)', () => {
    test('conocimiento tradicional nunca se presenta como verificado, sin importar el estado', () => {
      const parteUso=new ParteUso({id:'pu1',...parteUsoInput,tipoConocimiento:'Tradicional',estadoValidacion:'Validado'});
      expect(parteUso.puedeMostrarseComoVerificado()).toBe(false);
      expect(parteUso.etiquetaAdvertencia()).not.toBeNull();
    });
    test('conocimiento pendiente de validación nunca se presenta como verificado', () => {
      const parteUso=new ParteUso({id:'pu1',...parteUsoInput,tipoConocimiento:'Pendiente',estadoValidacion:'Pendiente'});
      expect(parteUso.puedeMostrarseComoVerificado()).toBe(false);
    });
    test('conocimiento científico sin validar todavía no se presenta como verificado', () => {
      const parteUso=new ParteUso({id:'pu1',...parteUsoInput,tipoConocimiento:'Científico',estadoValidacion:'Pendiente'});
      expect(parteUso.puedeMostrarseComoVerificado()).toBe(false);
    });
    test('conocimiento científico + validado por un especialista sí se presenta como verificado', () => {
      const parteUso=new ParteUso({id:'pu1',...parteUsoInput,tipoConocimiento:'Científico',estadoValidacion:'Validado'});
      expect(parteUso.puedeMostrarseComoVerificado()).toBe(true);
      expect(parteUso.etiquetaAdvertencia()).toBeNull();
    });
  });

  test('registra un Uso en el catálogo (RF-256)', async () => {
    const repo:any={guardar:jest.fn(),buscarPorNombre:jest.fn().mockResolvedValue(null)};
    const uso=await new RegistrarUsoUseCase(repo).ejecutar({nombre:'Digestivo'});
    expect(repo.guardar).toHaveBeenCalled();
    expect(uso.props.nombre).toBe('Digestivo');
  });
  test('rechaza un Uso duplicado en el catálogo', async () => {
    const repo:any={guardar:jest.fn(),buscarPorNombre:jest.fn().mockResolvedValue(new Uso({id:'u1',nombre:'Digestivo'}))};
    await expect(new RegistrarUsoUseCase(repo).ejecutar({nombre:'Digestivo'})).rejects.toThrow();
  });
  test('lista el catálogo de usos', async () => {
    const repo:any={listar:jest.fn().mockResolvedValue([new Uso({id:'u1',nombre:'Digestivo'})])};
    const usos=await new ListarUsosUseCase(repo).ejecutar();
    expect(usos).toHaveLength(1);
  });

  test('registra Parte+Uso, exige un Uso existente del catálogo y lo deja pendiente de revisión en M-09', async () => {
    const repo:any={guardar:jest.fn()};
    const usos:any={buscarPorId:jest.fn().mockResolvedValue(new Uso({id:'uso1',nombre:'Digestivo'}))};
    const validaciones:any={guardar:jest.fn()};
    const parteUso=await new RegistrarParteUsoUseCase(repo,usos,validaciones).ejecutar(parteUsoInput);
    expect(repo.guardar).toHaveBeenCalled();
    expect(parteUso.props.estadoValidacion).toBe('Pendiente');
    expect(validaciones.guardar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({tipoEntidad:'ParteUso',entidadId:parteUso.props.id,estado:'Pendiente'})}));
  });
  test('rechaza registrar Parte+Uso si el Uso no existe en el catálogo', async () => {
    const repo:any={guardar:jest.fn()};
    const usos:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    const validaciones:any={guardar:jest.fn()};
    await expect(new RegistrarParteUsoUseCase(repo,usos,validaciones).ejecutar(parteUsoInput)).rejects.toThrow();
  });

  test('obtiene un Parte+Uso incluyendo el flag de verificado y la advertencia', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(new ParteUso({id:'pu1',...parteUsoInput,tipoConocimiento:'Tradicional',estadoValidacion:'Pendiente'}))};
    const vista=await new ObtenerParteUsoUseCase(repo).ejecutar('pu1');
    expect(vista.verificado).toBe(false);
    expect(vista.advertencia).not.toBeNull();
  });
  test('lanza NotFoundError si el Parte+Uso no existe', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    await expect(new ObtenerParteUsoUseCase(repo).ejecutar('inexistente')).rejects.toThrow();
  });
  test('lista los Parte+Uso de una planta con el flag de verificado por cada uno', async () => {
    const repo:any={listarPorPlanta:jest.fn().mockResolvedValue([
      new ParteUso({id:'pu1',...parteUsoInput,tipoConocimiento:'Tradicional',estadoValidacion:'Pendiente'}),
      new ParteUso({id:'pu2',...parteUsoInput,tipoConocimiento:'Científico',estadoValidacion:'Validado'}),
    ])};
    const vistas=await new ListarPartesUsoUseCase(repo).ejecutar('p1');
    expect(vistas.map(v=>v.verificado)).toEqual([false,true]);
  });
});

function validation(overrides:Partial<ValidacionContenido['props']> = {}){return new ValidacionContenido({id:'v1',tipoEntidad:'Cultivo',entidadId:'c1',estado:'Pendiente',fecha:new Date(),autorId:'u1',...overrides});}
test.each([['aprobar', (repo:any, notifier:any, validables:any)=>new AprobarContenidoUseCase(repo,notifier,validables)],['observar', (repo:any, notifier:any, validables:any)=>new ObservarContenidoUseCase(repo,notifier,validables)],['rechazar', (repo:any, notifier:any, validables:any)=>new RechazarContenidoUseCase(repo,notifier,validables)]])('%s contenido con puertos mockeados',async(_name:any,createUseCase:any)=>{const v=validation(); const repo={buscarPorId:jest.fn().mockResolvedValue(v),guardar:jest.fn()}; const notifier={notificar:jest.fn()}; const useCase=createUseCase(repo,notifier); const input:any={validacionId:'v1',validadorId:'admin',rol:'Administrador'}; if(_name!=='aprobar') input.comentario='observación de prueba'; await useCase.ejecutar(input); expect(repo.guardar).toHaveBeenCalled(); expect(notifier.notificar).toHaveBeenCalled();});

describe('M-09 · sincronización de estado con la entidad de origen', () => {
  test('al aprobar, refleja el nuevo estado en el repositorio de Cultivo/ParteUso registrado para ese tipoEntidad', async () => {
    const v=validation({tipoEntidad:'ParteUso',entidadId:'pu1'});
    const repo={buscarPorId:jest.fn().mockResolvedValue(v),guardar:jest.fn()};
    const notifier={notificar:jest.fn()};
    const parteUsoRepo={actualizarEstadoValidacion:jest.fn()};
    const validables={ParteUso:parteUsoRepo};
    await new AprobarContenidoUseCase(repo as any,notifier as any,validables as any).ejecutar({validacionId:'v1',validadorId:'admin',rol:'Administrador'});
    expect(parteUsoRepo.actualizarEstadoValidacion).toHaveBeenCalledWith('pu1','Validado');
  });
  test('si no hay repositorio registrado para ese tipoEntidad, no falla (compatibilidad hacia atrás)', async () => {
    const v=validation();
    const repo={buscarPorId:jest.fn().mockResolvedValue(v),guardar:jest.fn()};
    const notifier={notificar:jest.fn()};
    await expect(new AprobarContenidoUseCase(repo as any,notifier as any).ejecutar({validacionId:'v1',validadorId:'admin',rol:'Administrador'})).resolves.not.toThrow();
  });
});

describe('M-09 · Bandeja de pendientes', () => {
  test('lista únicamente las validaciones pendientes, reusando listarPendientes() del repositorio', async () => {
    const repo:any={listarPendientes:jest.fn().mockResolvedValue([validation()])};
    const pendientes=await new ListarPendientesUseCase(repo,{} as any,{} as any).ejecutar();
    expect(pendientes).toHaveLength(1);
    expect(repo.listarPendientes).toHaveBeenCalled();
  });
});

describe('M-09 · Reportes (RF-25/RF-26)', () => {
  const reporteInput:any={tipoEntidad:'Planta',entidadId:'p1',autorId:'u1',motivo:'[DATO DE PRUEBA] Información posiblemente falsa'};

  test('registra un reporte pendiente sobre contenido ya publicado', async () => {
    const repo:any={guardar:jest.fn()};
    const reporte=await new ReportarContenidoUseCase(repo).ejecutar(reporteInput);
    expect(repo.guardar).toHaveBeenCalled();
    expect(reporte.props.estado).toBe('Pendiente');
    expect(reporte.props.tipoEntidad).toBe('Planta');
  });
  test('rechaza un reporte sin motivo', async () => {
    const repo:any={guardar:jest.fn()};
    await expect(new ReportarContenidoUseCase(repo).ejecutar({...reporteInput,motivo:''})).rejects.toThrow();
  });
  test('lista los reportes pendientes', async () => {
    const repo:any={listarPendientes:jest.fn().mockResolvedValue([new Reporte({id:'r1',...reporteInput,fecha:new Date(),estado:'Pendiente'})])};
    const reportes=await new ListarReportesPendientesUseCase(repo).ejecutar();
    expect(reportes).toHaveLength(1);
  });
  test('marca un reporte como revisado', async () => {
    const reporte=new Reporte({id:'r1',...reporteInput,fecha:new Date(),estado:'Pendiente'});
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(reporte),actualizar:jest.fn()};
    const actualizado=await new ActualizarEstadoReporteUseCase(repo).ejecutar('r1','Revisado');
    expect(actualizado.props.estado).toBe('Revisado');
    expect(repo.actualizar).toHaveBeenCalled();
  });
  test('marca un reporte como desestimado', async () => {
    const reporte=new Reporte({id:'r1',...reporteInput,fecha:new Date(),estado:'Pendiente'});
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(reporte),actualizar:jest.fn()};
    const actualizado=await new ActualizarEstadoReporteUseCase(repo).ejecutar('r1','Desestimado');
    expect(actualizado.props.estado).toBe('Desestimado');
  });
  test('rechaza volver a resolver un reporte que ya fue resuelto', async () => {
    const reporte=new Reporte({id:'r1',...reporteInput,fecha:new Date(),estado:'Revisado'});
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(reporte),actualizar:jest.fn()};
    await expect(new ActualizarEstadoReporteUseCase(repo).ejecutar('r1','Desestimado')).rejects.toThrow();
  });
  test('lanza NotFoundError si el reporte no existe', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    await expect(new ActualizarEstadoReporteUseCase(repo).ejecutar('inexistente','Revisado')).rejects.toThrow();
  });
});

describe('M-13 · Administración (básico)', () => {
  test('lista los usuarios registrados', async () => {
    const repo:any={listar:jest.fn().mockResolvedValue([usuarioActivo()])};
    const usuarios=await new ListarUsuariosUseCase(repo).ejecutar();
    expect(usuarios).toHaveLength(1);
  });

  test('suspende un usuario (RF-30)', async () => {
    const usuario=usuarioActivo();
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(usuario),actualizar:jest.fn()};
    const actualizado=await new SuspenderUsuarioUseCase(repo).ejecutar('u1');
    expect(actualizado.props.estado).toBe('Suspendido');
    expect(repo.actualizar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({estado:'Suspendido'})}));
  });

  test('un usuario suspendido no puede iniciar sesión (criterio de aceptación de RF-30)', async () => {
    const bcrypt=require('bcrypt');
    const usuario=usuarioActivo({estado:'Suspendido', contraseñaHash:await bcrypt.hash('password123',10)});
    const repo:any={buscarPorCorreo:jest.fn().mockResolvedValue(usuario)};
    await expect(new LoginUseCase(repo,'test-secret').ejecutar('test@example.com','password123')).rejects.toThrow(/suspendida/i);
  });

  test('reactiva un usuario suspendido y puede volver a iniciar sesión', async () => {
    const bcrypt=require('bcrypt');
    const usuario=usuarioActivo({estado:'Suspendido', contraseñaHash:await bcrypt.hash('password123',10)});
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(usuario),actualizar:jest.fn().mockImplementation(async (u:Usuario)=>{usuario.props.estado=u.props.estado;}),buscarPorCorreo:jest.fn().mockResolvedValue(usuario)};
    const actualizado=await new ReactivarUsuarioUseCase(repo).ejecutar('u1');
    expect(actualizado.props.estado).toBe('Activo');
    const login=await new LoginUseCase(repo,'test-secret').ejecutar('test@example.com','password123');
    expect(login.token).toBeTruthy();
  });

  test('lanza NotFoundError al suspender un usuario inexistente', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(null),actualizar:jest.fn()};
    await expect(new SuspenderUsuarioUseCase(repo).ejecutar('inexistente')).rejects.toThrow();
  });

  function planta(overrides:Partial<Planta['props']> = {}) { return new Planta({id:'p1',nombreComun:'[DATO DE PRUEBA] Planta',nombreCientifico:'Testus exampleus',familia:'F',region:'R',habitat:'H',...overrides}); }

  test('elimina una planta sin fichas de cultivo ni parte+uso asociadas (RF-31)', async () => {
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue(planta()),eliminar:jest.fn()};
    const cultivos:any={listarPorPlanta:jest.fn().mockResolvedValue([])};
    const partesUso:any={listarPorPlanta:jest.fn().mockResolvedValue([])};
    await new EliminarPlantaUseCase(plantas,cultivos,partesUso).ejecutar('p1');
    expect(plantas.eliminar).toHaveBeenCalledWith('p1');
  });
  test('rechaza eliminar una planta que tiene fichas de cultivo asociadas', async () => {
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue(planta()),eliminar:jest.fn()};
    const cultivos:any={listarPorPlanta:jest.fn().mockResolvedValue([{}])};
    const partesUso:any={listarPorPlanta:jest.fn().mockResolvedValue([])};
    await expect(new EliminarPlantaUseCase(plantas,cultivos,partesUso).ejecutar('p1')).rejects.toThrow();
    expect(plantas.eliminar).not.toHaveBeenCalled();
  });
  test('lanza NotFoundError al eliminar una planta inexistente', async () => {
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue(null),eliminar:jest.fn()};
    const cultivos:any={listarPorPlanta:jest.fn()}; const partesUso:any={listarPorPlanta:jest.fn()};
    await expect(new EliminarPlantaUseCase(plantas,cultivos,partesUso).ejecutar('inexistente')).rejects.toThrow();
  });

  test('el panel admin devuelve las métricas básicas de RF-32 (FASE 3)', async () => {
    const validaciones:any={listarPendientes:jest.fn().mockResolvedValue([validation(),validation()])};
    const usuarios:any={contar:jest.fn().mockResolvedValue(5),contarActivos:jest.fn().mockResolvedValue(4)};
    const plantas:any={contar:jest.fn().mockResolvedValue(3)};
    const publicaciones:any={contar:jest.fn().mockResolvedValue(7)};
    const reportes:any={contarPorEstado:jest.fn().mockResolvedValue({Pendiente:1,Revisado:2,Desestimado:0})};
    const panel=await new ObtenerPanelAdminUseCase(validaciones,usuarios,plantas,publicaciones,reportes).ejecutar();
    expect(panel).toEqual({validacionesPendientes:2,usuariosRegistrados:5,usuariosActivos:4,plantasPublicadas:3,publicacionesRealizadas:7,reportes:{pendientes:1,revisados:2,desestimados:0}});
  });
});

describe('M-06 · Publicaciones y Multimedia', () => {
  const publicacionInput:any={plantaId:'p1',autorId:'u1',nombreComun:'[DATO DE PRUEBA] Planta de ejemplo',descripcion:'dato de prueba',enfermedadesTratadas:'dato de prueba',formaPreparacion:'dato de prueba',imagenes:[],tipoConocimiento:'Tradicional',fuente:new Fuente('fuente de prueba')};
  function publicacion(overrides:Partial<Publicacion['props']> = {}) { return new Publicacion({id:'pub1',...publicacionInput,fechaPublicacion:new Date(),estadoValidacion:'Pendiente',...overrides}); }

  describe('regla de verificación (Publicacion.puedeMostrarseComoVerificado, mismo principio de RF-257)', () => {
    test('conocimiento tradicional nunca se presenta como verificado, sin importar el estado', () => {
      const p=publicacion({tipoConocimiento:'Tradicional',estadoValidacion:'Validado'});
      expect(p.puedeMostrarseComoVerificado()).toBe(false);
      expect(p.etiquetaAdvertencia()).not.toBeNull();
    });
    test('conocimiento científico + validado sí se presenta como verificado', () => {
      const p=publicacion({tipoConocimiento:'Científico',estadoValidacion:'Validado'});
      expect(p.puedeMostrarseComoVerificado()).toBe(true);
      expect(p.etiquetaAdvertencia()).toBeNull();
    });
  });

  test('crea una publicación pendiente, exige que la planta exista y la deja en revisión en M-09', async () => {
    const repo:any={guardar:jest.fn()};
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
    const validaciones:any={guardar:jest.fn()};
    const publicacionCreada=await new CrearPublicacionUseCase(repo,plantas,validaciones).ejecutar(publicacionInput);
    expect(repo.guardar).toHaveBeenCalled();
    expect(publicacionCreada.props.estadoValidacion).toBe('Pendiente');
    expect(validaciones.guardar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({tipoEntidad:'Publicacion',entidadId:publicacionCreada.props.id,estado:'Pendiente'})}));
  });
  test('rechaza crear una publicación sobre una planta que no existe en el catálogo', async () => {
    const repo:any={guardar:jest.fn()};
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    const validaciones:any={guardar:jest.fn()};
    await expect(new CrearPublicacionUseCase(repo,plantas,validaciones).ejecutar(publicacionInput)).rejects.toThrow();
  });

  test('una publicación PENDIENTE no aparece en el listado público', async () => {
    const repo:any={listar:jest.fn().mockResolvedValue([publicacion({id:'pendiente',estadoValidacion:'Pendiente'}),publicacion({id:'validada',estadoValidacion:'Validado'})])};
    const valoraciones:any={listarPorPublicacion:jest.fn().mockResolvedValue([])};
    const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    const comentarios:any={listarPorPublicacion:jest.fn().mockResolvedValue([])};
    const visibles=await new ListarPublicacionesUseCase(repo,valoraciones,usuarios,comentarios).ejecutar();
    expect(visibles).toHaveLength(1);
    expect(visibles[0].id).toBe('validada');
  });
  test('una publicación PENDIENTE tampoco se puede obtener por id (se trata como no encontrada)', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(publicacion({estadoValidacion:'Pendiente'}))};
    const valoraciones:any={listarPorPublicacion:jest.fn()};
    const usuarios:any={buscarPorId:jest.fn()};
    const comentarios:any={listarPorPublicacion:jest.fn()};
    await expect(new ObtenerPublicacionUseCase(repo,valoraciones,usuarios,comentarios).ejecutar('pub1')).rejects.toThrow();
  });
  test('una publicación validada se puede obtener e incluye el promedio de estrellas (RF-14)', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(publicacion({estadoValidacion:'Validado'}))};
    const valoraciones:any={listarPorPublicacion:jest.fn().mockResolvedValue([new Valoracion({id:'v1',publicacionId:'pub1',autorId:'a',estrellas:4}),new Valoracion({id:'v2',publicacionId:'pub1',autorId:'b',estrellas:2})])};
    const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    const comentarios:any={listarPorPublicacion:jest.fn().mockResolvedValue([])};
    const vista=await new ObtenerPublicacionUseCase(repo,valoraciones,usuarios,comentarios).ejecutar('pub1');
    expect(vista.promedioEstrellas).toBe(3);
    expect(vista.totalValoraciones).toBe(2);
  });

  test('el autor puede editar su publicación; vuelve a quedar pendiente de revisión', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(publicacion({estadoValidacion:'Validado'})),actualizar:jest.fn()};
    const validaciones:any={guardar:jest.fn()};
    const editada=await new EditarPublicacionUseCase(repo,validaciones).ejecutar('pub1','u1',{descripcion:'nueva descripción de prueba'});
    expect(editada.props.descripcion).toBe('nueva descripción de prueba');
    expect(editada.props.estadoValidacion).toBe('Pendiente');
    expect(validaciones.guardar).toHaveBeenCalled();
  });
  test('rechaza editar una publicación ajena', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(publicacion()),actualizar:jest.fn()};
    const validaciones:any={guardar:jest.fn()};
    await expect(new EditarPublicacionUseCase(repo,validaciones).ejecutar('pub1','otro-usuario',{descripcion:'x'})).rejects.toThrow();
  });

  test('el autor puede eliminar su propia publicación (y no se notifica a sí mismo, RF-54)', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(publicacion()),eliminar:jest.fn()};
    const notificador:any={notificar:jest.fn()};
    await new EliminarPublicacionUseCase(repo,notificador).ejecutar('pub1','u1','UsuarioRegistrado');
    expect(repo.eliminar).toHaveBeenCalledWith('pub1');
    expect(notificador.notificar).not.toHaveBeenCalled();
  });
  test('un administrador puede eliminar cualquier publicación y notifica al autor (RF-54)', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(publicacion()),eliminar:jest.fn()};
    const notificador:any={notificar:jest.fn()};
    await new EliminarPublicacionUseCase(repo,notificador).ejecutar('pub1','admin-id','Administrador');
    expect(repo.eliminar).toHaveBeenCalledWith('pub1');
    expect(notificador.notificar).toHaveBeenCalledWith('u1','publicacion_eliminada_moderacion');
  });
  test('rechaza eliminar la publicación de otro usuario si no es administrador', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(publicacion()),eliminar:jest.fn()};
    const notificador:any={notificar:jest.fn()};
    await expect(new EliminarPublicacionUseCase(repo,notificador).ejecutar('pub1','otro-usuario','UsuarioRegistrado')).rejects.toThrow();
    expect(repo.eliminar).not.toHaveBeenCalled();
  });

  test('sube una imagen delegando en el AlmacenamientoMediaPort (RF-10)', async () => {
    const almacenamiento:any={guardar:jest.fn().mockResolvedValue('/uploads/abc.png')};
    const resultado=await new SubirMediaUseCase(almacenamiento).ejecutar({nombreOriginal:'foto.png',contenidoBase64:'ZGF0byBkZSBwcnVlYmE='});
    expect(resultado).toEqual({url:'/uploads/abc.png'});
    expect(almacenamiento.guardar).toHaveBeenCalledWith('foto.png','ZGF0byBkZSBwcnVlYmE=');
  });
});

describe('M-07 · Comunidad y Experiencias', () => {
  function publicacionVisible(overrides:Partial<Publicacion['props']> = {}) { return new Publicacion({id:'pub1',plantaId:'p1',autorId:'u1',nombreComun:'x',descripcion:'x',enfermedadesTratadas:'x',formaPreparacion:'x',imagenes:[],tipoConocimiento:'Tradicional',fuente:new Fuente('fuente de prueba'),fechaPublicacion:new Date(),estadoValidacion:'Validado',...overrides}); }

  test('comenta en una publicación ya visible y notifica al autor de la publicación (RF-13/RF-51)', async () => {
    const repo:any={guardar:jest.fn()};
    const publicaciones:any={buscarPorId:jest.fn().mockResolvedValue(publicacionVisible())};
    const notificador:any={notificar:jest.fn()};
    const comentario=await new ComentarPublicacionUseCase(repo,publicaciones,notificador).ejecutar({publicacionId:'pub1',autorId:'u2',texto:'[DATO DE PRUEBA] Muy útil, gracias'});
    expect(repo.guardar).toHaveBeenCalled();
    expect(comentario.props.texto).toContain('DATO DE PRUEBA');
    expect(notificador.notificar).toHaveBeenCalledWith('u1','comentario_nuevo');
  });
  test('no notifica al autor si comenta en su propia publicación', async () => {
    const repo:any={guardar:jest.fn()};
    const publicaciones:any={buscarPorId:jest.fn().mockResolvedValue(publicacionVisible())};
    const notificador:any={notificar:jest.fn()};
    await new ComentarPublicacionUseCase(repo,publicaciones,notificador).ejecutar({publicacionId:'pub1',autorId:'u1',texto:'comentario propio'});
    expect(notificador.notificar).not.toHaveBeenCalled();
  });
  test('rechaza comentar una publicación que todavía no fue aprobada', async () => {
    const repo:any={guardar:jest.fn()};
    const publicaciones:any={buscarPorId:jest.fn().mockResolvedValue(publicacionVisible({estadoValidacion:'Pendiente'}))};
    const notificador:any={notificar:jest.fn()};
    await expect(new ComentarPublicacionUseCase(repo,publicaciones,notificador).ejecutar({publicacionId:'pub1',autorId:'u2',texto:'x'})).rejects.toThrow();
  });
  test('responde a un comentario raíz y notifica también al autor del comentario respondido (RF-130/RF-52)', async () => {
    const raiz=new Comentario({id:'c1',publicacionId:'pub1',autorId:'u2',texto:'raíz',fecha:new Date()});
    const repo:any={guardar:jest.fn(),buscarPorId:jest.fn().mockResolvedValue(raiz)};
    const publicaciones:any={buscarPorId:jest.fn().mockResolvedValue(publicacionVisible())};
    const notificador:any={notificar:jest.fn()};
    const respuesta=await new ComentarPublicacionUseCase(repo,publicaciones,notificador).ejecutar({publicacionId:'pub1',autorId:'u3',texto:'respuesta',comentarioPadreId:'c1'});
    expect(respuesta.props.comentarioPadreId).toBe('c1');
    expect(notificador.notificar).toHaveBeenCalledWith('u1','comentario_nuevo');
    expect(notificador.notificar).toHaveBeenCalledWith('u2','respuesta_comentario');
  });
  test('rechaza responder a una respuesta (solo un nivel de profundidad)', async () => {
    const respuestaExistente=new Comentario({id:'c2',publicacionId:'pub1',autorId:'u3',texto:'respuesta',fecha:new Date(),comentarioPadreId:'c1'});
    const repo:any={guardar:jest.fn(),buscarPorId:jest.fn().mockResolvedValue(respuestaExistente)};
    const publicaciones:any={buscarPorId:jest.fn().mockResolvedValue(publicacionVisible())};
    const notificador:any={notificar:jest.fn()};
    await expect(new ComentarPublicacionUseCase(repo,publicaciones,notificador).ejecutar({publicacionId:'pub1',autorId:'u4',texto:'x',comentarioPadreId:'c2'})).rejects.toThrow();
  });
  test('lista los comentarios de una publicación', async () => {
    const repo:any={listarPorPublicacion:jest.fn().mockResolvedValue([new Comentario({id:'c1',publicacionId:'pub1',autorId:'u2',texto:'x',fecha:new Date()})])};
    const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    const comentarios=await new ListarComentariosUseCase(repo,usuarios).ejecutar('pub1');
    expect(comentarios).toHaveLength(1);
  });

  test('califica una publicación con estrellas por primera vez y notifica al autor (RF-14/RF-193)', async () => {
    const repo:any={buscarPorAutorYPublicacion:jest.fn().mockResolvedValue(null),guardar:jest.fn(),actualizar:jest.fn()};
    const publicaciones:any={buscarPorId:jest.fn().mockResolvedValue(publicacionVisible())};
    const notificador:any={notificar:jest.fn()};
    const valoracion=await new CalificarPublicacionUseCase(repo,publicaciones,notificador).ejecutar({publicacionId:'pub1',autorId:'u2',estrellas:4});
    expect(repo.guardar).toHaveBeenCalled();
    expect(repo.actualizar).not.toHaveBeenCalled();
    expect(valoracion.props.estrellas).toBe(4);
    expect(notificador.notificar).toHaveBeenCalledWith('u1','calificacion_nueva');
  });
  test('calificar de nuevo actualiza la valoración anterior en vez de duplicarla', async () => {
    const existente=new Valoracion({id:'v1',publicacionId:'pub1',autorId:'u2',estrellas:2});
    const repo:any={buscarPorAutorYPublicacion:jest.fn().mockResolvedValue(existente),guardar:jest.fn(),actualizar:jest.fn()};
    const publicaciones:any={buscarPorId:jest.fn().mockResolvedValue(publicacionVisible())};
    const notificador:any={notificar:jest.fn()};
    const valoracion=await new CalificarPublicacionUseCase(repo,publicaciones,notificador).ejecutar({publicacionId:'pub1',autorId:'u2',estrellas:5});
    expect(repo.guardar).not.toHaveBeenCalled();
    expect(repo.actualizar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({id:'v1',estrellas:5})}));
    expect(valoracion.props.estrellas).toBe(5);
  });
  test('no notifica al autor si califica su propia publicación', async () => {
    const repo:any={buscarPorAutorYPublicacion:jest.fn().mockResolvedValue(null),guardar:jest.fn(),actualizar:jest.fn()};
    const publicaciones:any={buscarPorId:jest.fn().mockResolvedValue(publicacionVisible())};
    const notificador:any={notificar:jest.fn()};
    await new CalificarPublicacionUseCase(repo,publicaciones,notificador).ejecutar({publicacionId:'pub1',autorId:'u1',estrellas:5});
    expect(notificador.notificar).not.toHaveBeenCalled();
  });
  test('rechaza calificar con un número de estrellas fuera de rango', async () => {
    const repo:any={buscarPorAutorYPublicacion:jest.fn().mockResolvedValue(null),guardar:jest.fn()};
    const publicaciones:any={buscarPorId:jest.fn().mockResolvedValue(publicacionVisible())};
    const notificador:any={notificar:jest.fn()};
    await expect(new CalificarPublicacionUseCase(repo,publicaciones,notificador).ejecutar({publicacionId:'pub1',autorId:'u2',estrellas:7})).rejects.toThrow();
  });
});

describe('M-05 · Preparaciones', () => {
  const preparacionInput:any={parteUsoId:'pu1',autorId:'u1',ingredientes:'dato de prueba',pasos:'dato de prueba',herramientas:'dato de prueba',tiempoPreparacion:'dato de prueba',formaTradicionalElaboracion:'dato de prueba',formaConservacion:'dato de prueba',advertencias:'dato de prueba',fuente:new Fuente('fuente de prueba'),localidad:'dato de prueba'};
  function preparacion(overrides:Partial<Preparacion['props']> = {}) { return new Preparacion({id:'prep1',...preparacionInput,fecha:new Date(),estadoValidacion:'Pendiente',...overrides}); }

  test('el aviso cultural/tradicional es permanente e incondicional, sin importar el estado', () => {
    expect(preparacion({estadoValidacion:'Pendiente'}).avisoLegal()).toMatch(/cultural\/tradicional/i);
    expect(preparacion({estadoValidacion:'Validado'}).avisoLegal()).toMatch(/cultural\/tradicional/i);
  });

  test('documenta una preparación, exige que la combinación Parte+Uso exista y la deja pendiente en M-09', async () => {
    const repo:any={guardar:jest.fn()};
    const partesUso:any={buscarPorId:jest.fn().mockResolvedValue({id:'pu1'})};
    const validaciones:any={guardar:jest.fn()};
    const documentada=await new DocumentarPreparacionUseCase(repo,partesUso,validaciones).ejecutar(preparacionInput);
    expect(repo.guardar).toHaveBeenCalled();
    expect(documentada.props.estadoValidacion).toBe('Pendiente');
    expect(validaciones.guardar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({tipoEntidad:'Preparacion',entidadId:documentada.props.id,estado:'Pendiente'})}));
  });
  test('rechaza documentar una preparación sobre una combinación Parte+Uso inexistente', async () => {
    const repo:any={guardar:jest.fn()};
    const partesUso:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    const validaciones:any={guardar:jest.fn()};
    await expect(new DocumentarPreparacionUseCase(repo,partesUso,validaciones).ejecutar(preparacionInput)).rejects.toThrow();
  });

  test('una preparación pendiente no se puede obtener públicamente', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(preparacion({estadoValidacion:'Pendiente'}))};
    await expect(new ObtenerPreparacionUseCase(repo).ejecutar('prep1')).rejects.toThrow();
  });
  test('una preparación validada se puede obtener e incluye el aviso legal', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(preparacion({estadoValidacion:'Validado'}))};
    const vista=await new ObtenerPreparacionUseCase(repo).ejecutar('prep1');
    expect(vista.avisoLegal).toMatch(/cultural\/tradicional/i);
    expect(vista.estadoValidacion).toBe('Validado');
  });
  test('lista solo las preparaciones validadas de una combinación Parte+Uso (RF-261)', async () => {
    const repo:any={listarPorParteUso:jest.fn().mockResolvedValue([preparacion({id:'p1',estadoValidacion:'Pendiente'}),preparacion({id:'p2',estadoValidacion:'Validado'})])};
    const visibles=await new ListarPreparacionesUseCase(repo).ejecutar('pu1');
    expect(visibles).toHaveLength(1);
    expect(visibles[0].id).toBe('p2');
  });
});

describe('M-11 · Productos y Emprendimientos', () => {
  const productoInput:any={productorId:'prod1',nombre:'[DATO DE PRUEBA] Jabón de manzanilla',plantasIds:['p1'],fotografias:[],localidad:'dato de prueba',informacionProceso:'dato de prueba',contactoVendedor:'dato de prueba'};
  function producto(overrides:Partial<Producto['props']> = {}) { return new Producto({id:'prod-1',...productoInput,estadoValidacion:'Pendiente',requiereRevisionReforzada:false,etiquetaValidadoDocumental:false,etiquetaCertificado:false,...overrides}); }
  // Productor que YA aceptó la comisión (aceptoComisionEn no-null) -- así la mayoría de los tests
  // de este bloque no necesitan preocuparse por el frente de comisión, que se prueba aparte más
  // abajo ("Frente 3 · comisión del 5%").
  const usuariosConComisionAceptada:any={buscarPorId:jest.fn().mockResolvedValue({props:{id:'prod1',aceptoComisionEn:new Date('2026-01-01')}}),actualizar:jest.fn()};

  describe('RF-274 · anti-afirmaciones engañosas', () => {
    test('un producto con "cura el cáncer" en la descripción queda marcado para revisión reforzada', async () => {
      const repo:any={guardar:jest.fn()};
      const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
      const validaciones:any={guardar:jest.fn()};
      const creado=await new PublicarProductoUseCase(repo,plantas,validaciones,usuariosConComisionAceptada).ejecutar({...productoInput,descripcion:'Este ungüento cura el cáncer y elimina el dolor de forma definitiva'});
      expect(creado.props.requiereRevisionReforzada).toBe(true);
      // Sigue publicándose (queda Pendiente, entra a M-09) -- no se bloquea la creación, se refuerza el control humano.
      expect(repo.guardar).toHaveBeenCalled();
      expect(creado.props.estadoValidacion).toBe('Pendiente');
    });
    test('un producto sin afirmaciones engañosas sigue el flujo normal (sin marca de revisión reforzada)', async () => {
      const repo:any={guardar:jest.fn()};
      const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
      const validaciones:any={guardar:jest.fn()};
      const creado=await new PublicarProductoUseCase(repo,plantas,validaciones,usuariosConComisionAceptada).ejecutar({...productoInput,descripcion:'Jabón artesanal elaborado con manzanilla de nuestra huerta'});
      expect(creado.props.requiereRevisionReforzada).toBe(false);
    });
    test('detecta variantes con tildes/mayúsculas ("Cura la diabetes")', async () => {
      const repo:any={guardar:jest.fn()};
      const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
      const validaciones:any={guardar:jest.fn()};
      const creado=await new PublicarProductoUseCase(repo,plantas,validaciones,usuariosConComisionAceptada).ejecutar({...productoInput,descripcion:'Cura la diabetes en pocos días'});
      expect(creado.props.requiereRevisionReforzada).toBe(true);
    });
  });

  describe('Frente 3 · comisión del 5% (aceptación única en el perfil)', () => {
    test('rechaza publicar si el productor nunca aceptó la comisión y no la acepta en este envío', async () => {
      const repo:any={guardar:jest.fn()};
      const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
      const validaciones:any={guardar:jest.fn()};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue({props:{id:'prod1',aceptoComisionEn:null}}),actualizar:jest.fn()};
      await expect(new PublicarProductoUseCase(repo,plantas,validaciones,usuarios).ejecutar(productoInput)).rejects.toThrow(/comisión/i);
      expect(repo.guardar).not.toHaveBeenCalled();
    });
    test('primera vez: si acepta la comisión en el envío, publica y registra la fecha en el perfil', async () => {
      const repo:any={guardar:jest.fn()};
      const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
      const validaciones:any={guardar:jest.fn()};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue({props:{id:'prod1',aceptoComisionEn:null}}),actualizar:jest.fn()};
      const creado=await new PublicarProductoUseCase(repo,plantas,validaciones,usuarios).ejecutar({...productoInput,aceptaComision:true});
      expect(repo.guardar).toHaveBeenCalled();
      expect(usuarios.actualizar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({aceptoComisionEn:expect.any(Date)})}));
      expect(creado.props.estadoValidacion).toBe('Pendiente');
    });
    test('si ya había aceptado antes, publicar de nuevo no vuelve a pedirlo ni reescribe la fecha', async () => {
      const repo:any={guardar:jest.fn()};
      const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
      const validaciones:any={guardar:jest.fn()};
      const creado=await new PublicarProductoUseCase(repo,plantas,validaciones,usuariosConComisionAceptada).ejecutar(productoInput);
      expect(repo.guardar).toHaveBeenCalled();
      expect(usuariosConComisionAceptada.actualizar).not.toHaveBeenCalled();
      expect(creado.props.estadoValidacion).toBe('Pendiente');
    });
  });

  test('publica un producto, exige que las plantas existan y lo deja pendiente en M-09', async () => {
    const repo:any={guardar:jest.fn()};
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
    const validaciones:any={guardar:jest.fn()};
    const creado=await new PublicarProductoUseCase(repo,plantas,validaciones,usuariosConComisionAceptada).ejecutar(productoInput);
    expect(repo.guardar).toHaveBeenCalled();
    expect(creado.props.estadoValidacion).toBe('Pendiente');
    expect(validaciones.guardar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({tipoEntidad:'Producto',entidadId:creado.props.id,estado:'Pendiente'})}));
  });
  test('rechaza publicar un producto sin campos obligatorios (RF-273): sin localidad', async () => {
    const repo:any={guardar:jest.fn()};
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
    const validaciones:any={guardar:jest.fn()};
    await expect(new PublicarProductoUseCase(repo,plantas,validaciones,usuariosConComisionAceptada).ejecutar({...productoInput,localidad:''})).rejects.toThrow();
  });
  test('rechaza publicar un producto referenciando una planta que no existe', async () => {
    const repo:any={guardar:jest.fn()};
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    const validaciones:any={guardar:jest.fn()};
    await expect(new PublicarProductoUseCase(repo,plantas,validaciones,usuariosConComisionAceptada).ejecutar(productoInput)).rejects.toThrow();
  });

  const plantasStub:any={buscarPorId:jest.fn().mockResolvedValue(null)};
  const usuariosStub:any={buscarPorId:jest.fn().mockResolvedValue(null)};

  test('un producto pendiente no se puede obtener públicamente', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(producto({estadoValidacion:'Pendiente'}))};
    await expect(new ObtenerProductoUseCase(repo,plantasStub,usuariosStub).ejecutar('prod-1')).rejects.toThrow();
  });
  test('un producto validado se puede obtener y "revisadoPorEquipo" se deriva del estado', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(producto({estadoValidacion:'Validado'}))};
    const vista=await new ObtenerProductoUseCase(repo,plantasStub,usuariosStub).ejecutar('prod-1');
    expect(vista.revisadoPorEquipo).toBe(true);
    expect(vista.contactoVendedor).toBe('dato de prueba');
  });
  test('lista solo productos validados, con filtro opcional por localidad', async () => {
    const repo:any={listar:jest.fn().mockResolvedValue([producto({id:'a',estadoValidacion:'Validado',localidad:'Cusco'}),producto({id:'b',estadoValidacion:'Validado',localidad:'Lima'}),producto({id:'c',estadoValidacion:'Pendiente',localidad:'Lima'})])};
    const todos=await new ListarProductosUseCase(repo,plantasStub,usuariosStub).ejecutar();
    expect(todos).toHaveLength(2);
    const soloLima=await new ListarProductosUseCase(repo,plantasStub,usuariosStub).ejecutar({localidad:'Lima'});
    expect(soloLima).toHaveLength(1);
    expect(soloLima[0].id).toBe('b');
  });

  test('las 3 etiquetas son independientes: revisado no activa validado documental ni certificado', () => {
    const p=producto({estadoValidacion:'Validado'});
    expect(p.revisadoPorEquipo()).toBe(true);
    expect(p.props.etiquetaValidadoDocumental).toBe(false);
    expect(p.props.etiquetaCertificado).toBe(false);
  });
  test('marca un producto como validado documentalmente', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(producto({estadoValidacion:'Validado'})),actualizar:jest.fn()};
    const actualizado=await new MarcarValidadoDocumentalmenteUseCase(repo).ejecutar('prod-1');
    expect(actualizado.props.etiquetaValidadoDocumental).toBe(true);
    expect(actualizado.props.etiquetaCertificado).toBe(false);
    expect(repo.actualizar).toHaveBeenCalled();
  });
  test('rechaza certificar un producto que todavía no fue aprobado/publicado', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(producto({estadoValidacion:'Pendiente'})),actualizar:jest.fn()};
    await expect(new MarcarCertificadoUseCase(repo).ejecutar('prod-1','[DATO DE PRUEBA] certificado.pdf')).rejects.toThrow();
    expect(repo.actualizar).not.toHaveBeenCalled();
  });
  test('rechaza certificar sin adjuntar una certificación real', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(producto({estadoValidacion:'Validado'})),actualizar:jest.fn()};
    await expect(new MarcarCertificadoUseCase(repo).ejecutar('prod-1','')).rejects.toThrow();
  });
  test('certifica un producto ya aprobado con una certificación real', async () => {
    const repo:any={buscarPorId:jest.fn().mockResolvedValue(producto({estadoValidacion:'Validado'})),actualizar:jest.fn()};
    const certificado=await new MarcarCertificadoUseCase(repo).ejecutar('prod-1','[DATO DE PRUEBA] certificado.pdf');
    expect(certificado.props.etiquetaCertificado).toBe(true);
    expect(certificado.props.documentacionCertificacion).toBe('[DATO DE PRUEBA] certificado.pdf');
  });
});

describe('M-10 · Conservación y Especies Prioritarias', () => {
  const estadoInput:any={plantaId:'p1',autorId:'u1',categoria:'[DATO DE PRUEBA] Vulnerable',zona:'[DATO DE PRUEBA] Cuenca alta del río de prueba',amenazas:'[DATO DE PRUEBA] Sobreextracción y pérdida de hábitat',nivelRiesgo:'Vulnerable',disponibilidadTemporada:'[DATO DE PRUEBA] Todo el año',recomendacionesConservacion:'[DATO DE PRUEBA] No recolectar más del 10% de una población',metodosPropagacion:'[DATO DE PRUEBA] Semilla y esqueje',alternativasCultivo:'[DATO DE PRUEBA] Cultivo en vivero controlado'};
  function estado(overrides:Partial<EstadoConservacion['props']> = {}) { return new EstadoConservacion({id:'ec1',...estadoInput,fuenteOficial:new Fuente('[DATO DE PRUEBA] Ficha de conservación ficticia para pruebas'),fecha:new Date(),estadoValidacion:'Pendiente',...overrides}); }

  test('la entidad EstadoConservacion no puede construirse sin fuente oficial (Fuente ya lo garantiza)', () => {
    expect(() => new EstadoConservacion({id:'ec1',...estadoInput,fuenteOficial:new Fuente(''),fecha:new Date(),estadoValidacion:'Pendiente'})).toThrow();
  });

  test('registra un estado de conservación con fuente y lo deja pendiente de revisión en M-09', async () => {
    const repo:any={guardar:jest.fn()};
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
    const validaciones:any={guardar:jest.fn()};
    const input={...estadoInput, fuenteOficial:new Fuente('[DATO DE PRUEBA] Ficha de conservación ficticia para pruebas')};
    const registrado=await new RegistrarEstadoConservacionUseCase(repo,plantas,validaciones).ejecutar(input);
    expect(repo.guardar).toHaveBeenCalled();
    expect(registrado.props.estadoValidacion).toBe('Pendiente');
    expect(validaciones.guardar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({tipoEntidad:'EstadoConservacion',entidadId:registrado.props.id,estado:'Pendiente'})}));
  });
  test('el caso de uso también rechaza si la planta no existe', async () => {
    const repo:any={guardar:jest.fn()};
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    const validaciones:any={guardar:jest.fn()};
    const input={...estadoInput, fuenteOficial:new Fuente('[DATO DE PRUEBA] Ficha de conservación ficticia para pruebas')};
    await expect(new RegistrarEstadoConservacionUseCase(repo,plantas,validaciones).ejecutar(input)).rejects.toThrow();
  });

  test('sin ningún estado validado para la planta, se muestra el texto literal "no determinado" (RF-267)', async () => {
    const repo:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(null)};
    const vista=await new ObtenerEstadoConservacionUseCase(repo).ejecutar('p1');
    expect(vista.disponible).toBe(false);
    if (!vista.disponible) { expect(vista.mensaje).toBe('Estado de conservación: no determinado — pendiente de fuente oficial'); expect(vista.alertaVisible).toBe(false); }
  });
  test('con un estado Vulnerable validado, se muestra con alertaVisible=true (RF-269)', async () => {
    const repo:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(estado({estadoValidacion:'Validado',nivelRiesgo:'Vulnerable'}))};
    const vista=await new ObtenerEstadoConservacionUseCase(repo).ejecutar('p1');
    expect(vista.disponible).toBe(true);
    if (vista.disponible) expect(vista.alertaVisible).toBe(true);
  });
  test('con un estado de "Preocupación menor" validado, no hay alerta', async () => {
    const repo:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(estado({estadoValidacion:'Validado',nivelRiesgo:'PreocupacionMenor'}))};
    const vista=await new ObtenerEstadoConservacionUseCase(repo).ejecutar('p1');
    expect(vista.disponible).toBe(true);
    if (vista.disponible) expect(vista.alertaVisible).toBe(false);
  });
  test('un estado registrado pero todavía Pendiente no cuenta como "determinado" (no pasó por M-09)', async () => {
    const repo:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(null)};
    const vista=await new ObtenerEstadoConservacionUseCase(repo).ejecutar('p1');
    expect(vista.disponible).toBe(false);
  });

  test('registra una acción de conservación vinculada a una planta, sin exigir fuente (RF-268)', async () => {
    const repo:any={guardar:jest.fn()};
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue({id:'p1'})};
    const accion=await new RegistrarAccionConservacionUseCase(repo,plantas).ejecutar({plantaId:'p1',autorId:'u1',descripcion:'[DATO DE PRUEBA] Campaña de reforestación',responsable:'[DATO DE PRUEBA] Comité local',evidencias:'[DATO DE PRUEBA] Fotos del vivero',estadoSeguimiento:'EnCurso'});
    expect(repo.guardar).toHaveBeenCalled();
    expect(accion.props.estadoSeguimiento).toBe('EnCurso');
  });
  test('rechaza registrar una acción sobre una planta inexistente', async () => {
    const repo:any={guardar:jest.fn()};
    const plantas:any={buscarPorId:jest.fn().mockResolvedValue(null)};
    await expect(new RegistrarAccionConservacionUseCase(repo,plantas).ejecutar({plantaId:'inexistente',autorId:'u1',descripcion:'x',responsable:'x',evidencias:'x',estadoSeguimiento:'EnCurso'})).rejects.toThrow();
  });
  test('lista las acciones de conservación de una planta', async () => {
    const repo:any={listarPorPlanta:jest.fn().mockResolvedValue([new AccionConservacion({id:'a1',plantaId:'p1',autorId:'u1',descripcion:'x',responsable:'x',evidencias:'x',estadoSeguimiento:'Completada',fecha:new Date()})])};
    const acciones=await new ListarAccionesConservacionUseCase(repo).ejecutar('p1');
    expect(acciones).toHaveLength(1);
  });
});

describe('RF-271 · Mapa de distribución (mapa-cultivo.port.ts activado)', () => {
  const cultivoP1:any={props:{id:'c1',plantaId:'p1'}};

  describe('RegistrarUbicacionCultivoUseCase', () => {
    test('registra zona y coordenadas cuando la planta NO está en riesgo', async () => {
      const repo:any={guardar:jest.fn()};
      const cultivos:any={buscarPorId:jest.fn().mockResolvedValue(cultivoP1)};
      const estadosConservacion:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(null)};
      const ubicacion=await new RegistrarUbicacionCultivoUseCase(repo,cultivos,estadosConservacion).ejecutar({cultivoId:'c1',autorId:'u1',zona:'[DATO DE PRUEBA] Valle de prueba',latitud:-11.5,longitud:-75.2});
      expect(repo.guardar).toHaveBeenCalled();
      expect(ubicacion.props.plantaId).toBe('p1');
      expect(ubicacion.props.latitud).toBe(-11.5);
      expect(ubicacion.props.longitud).toBe(-75.2);
    });

    test('RN-07: nunca guarda coordenadas exactas si la planta está en riesgo, aunque se envíen', async () => {
      const repo:any={guardar:jest.fn()};
      const cultivos:any={buscarPorId:jest.fn().mockResolvedValue(cultivoP1)};
      const estado=new EstadoConservacion({id:'ec1',plantaId:'p1',autorId:'u1',categoria:'[DATO DE PRUEBA] Vulnerable',zona:'[DATO DE PRUEBA] zona amplia',amenazas:'x',nivelRiesgo:'Vulnerable',disponibilidadTemporada:'x',recomendacionesConservacion:'x',metodosPropagacion:'x',alternativasCultivo:'x',fuenteOficial:new Fuente('[DATO DE PRUEBA] fuente'),fecha:new Date(),estadoValidacion:'Validado'});
      const estadosConservacion:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(estado)};
      const ubicacion=await new RegistrarUbicacionCultivoUseCase(repo,cultivos,estadosConservacion).ejecutar({cultivoId:'c1',autorId:'u1',zona:'[DATO DE PRUEBA] zona amplia',latitud:-11.5,longitud:-75.2});
      expect(ubicacion.props.latitud).toBeNull();
      expect(ubicacion.props.longitud).toBeNull();
      expect(ubicacion.props.zona).toBe('[DATO DE PRUEBA] zona amplia');
    });

    test('rechaza si el cultivo indicado no existe', async () => {
      const repo:any={guardar:jest.fn()};
      const cultivos:any={buscarPorId:jest.fn().mockResolvedValue(null)};
      const estadosConservacion:any={buscarValidadoPorPlanta:jest.fn()};
      await expect(new RegistrarUbicacionCultivoUseCase(repo,cultivos,estadosConservacion).ejecutar({cultivoId:'inexistente',autorId:'u1',zona:'x'})).rejects.toThrow();
    });

    test('rechaza zona vacía', async () => {
      const repo:any={guardar:jest.fn()};
      const cultivos:any={buscarPorId:jest.fn().mockResolvedValue(cultivoP1)};
      const estadosConservacion:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(null)};
      await expect(new RegistrarUbicacionCultivoUseCase(repo,cultivos,estadosConservacion).ejecutar({cultivoId:'c1',autorId:'u1',zona:'  '})).rejects.toThrow();
    });
  });

  describe('ListarMapaCultivoUseCase', () => {
    function ubicacion(overrides:Partial<UbicacionCultivo['props']> = {}) { return new UbicacionCultivo({id:'ub1',cultivoId:'c1',plantaId:'p1',autorId:'u1',zona:'[DATO DE PRUEBA] zona',latitud:-11.5,longitud:-75.2,fecha:new Date(),...overrides}); }

    test('enriquece cada ubicación con el nombre de la planta y expone coordenadas si no hay riesgo', async () => {
      const repo:any={listarTodas:jest.fn().mockResolvedValue([ubicacion()])};
      const plantas:any={buscarPorId:jest.fn().mockResolvedValue({props:{id:'p1',nombreComun:'Uña de gato'}})};
      const cultivos:any={buscarPorId:jest.fn().mockResolvedValue({props:{id:'c1',metodoPropagacion:'Esqueje'}})};
      const estadosConservacion:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(null)};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue({props:{id:'u1',nombre:'[DATO DE PRUEBA] Autor Uno'}})};
      const mapa=await new ListarMapaCultivoUseCase(repo,plantas,cultivos,estadosConservacion,usuarios).ejecutar();
      expect(mapa).toHaveLength(1);
      expect(mapa[0].nombreComunPlanta).toBe('Uña de gato');
      expect(mapa[0].tipoCultivo).toBe('Esqueje');
      expect(mapa[0].latitud).toBe(-11.5);
      expect(mapa[0].longitud).toBe(-75.2);
      expect(mapa[0].autorNombre).toBe('[DATO DE PRUEBA] Autor Uno');
    });

    test('RN-07: oculta coordenadas ya guardadas si la planta pasó a estar en riesgo después', async () => {
      const repo:any={listarTodas:jest.fn().mockResolvedValue([ubicacion()])};
      const plantas:any={buscarPorId:jest.fn().mockResolvedValue({props:{id:'p1',nombreComun:'Uña de gato'}})};
      const cultivos:any={buscarPorId:jest.fn().mockResolvedValue({props:{id:'c1',metodoPropagacion:'Esqueje'}})};
      const estado=new EstadoConservacion({id:'ec1',plantaId:'p1',autorId:'u1',categoria:'[DATO DE PRUEBA] Vulnerable',zona:'x',amenazas:'x',nivelRiesgo:'EnPeligro',disponibilidadTemporada:'x',recomendacionesConservacion:'x',metodosPropagacion:'x',alternativasCultivo:'x',fuenteOficial:new Fuente('[DATO DE PRUEBA] fuente'),fecha:new Date(),estadoValidacion:'Validado'});
      const estadosConservacion:any={buscarValidadoPorPlanta:jest.fn().mockResolvedValue(estado)};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue({props:{id:'u1',nombre:'[DATO DE PRUEBA] Autor Uno'}})};
      const mapa=await new ListarMapaCultivoUseCase(repo,plantas,cultivos,estadosConservacion,usuarios).ejecutar();
      expect(mapa[0].latitud).toBeNull();
      expect(mapa[0].longitud).toBeNull();
      expect(mapa[0].zona).toBe('[DATO DE PRUEBA] zona');
    });
  });
});

describe('M-09 · ValidacionContenido guarda quién tomó la decisión (auditoría, RNF-304)', () => {
  function validacionPendiente() { return new ValidacionContenido({id:'v1',tipoEntidad:'Cultivo',entidadId:'c1',estado:'Pendiente',fecha:new Date(),autorId:'autor-original'}); }
  test('aprobar() guarda validadorId (antes se mezclaba con comentarioValidador)', () => {
    const v=validacionPendiente();
    v.aprobar('especialista-1','Administrador');
    expect(v.props.validadorId).toBe('especialista-1');
    expect(v.props.estado).toBe('Validado');
  });
  test('observar() guarda validadorId además del comentario (antes se descartaba)', () => {
    const v=validacionPendiente();
    v.observar('especialista-2','[DATO DE PRUEBA] falta la fuente','Administrador');
    expect(v.props.validadorId).toBe('especialista-2');
    expect(v.props.comentarioValidador).toBe('[DATO DE PRUEBA] falta la fuente');
  });
  test('rechazar() guarda validadorId además del motivo (antes se descartaba)', () => {
    const v=validacionPendiente();
    v.rechazar('especialista-3','[DATO DE PRUEBA] contenido inapropiado','Administrador');
    expect(v.props.validadorId).toBe('especialista-3');
    expect(v.props.comentarioValidador).toBe('[DATO DE PRUEBA] contenido inapropiado');
  });
});

describe('M-09 · RN-05: un especialista solo valida contenido de su propia área', () => {
  function pendiente(tipoEntidad:string) { return new ValidacionContenido({id:'v1',tipoEntidad,entidadId:'e1',estado:'Pendiente',fecha:new Date(),autorId:'autor-original'}); }

  test.each([
    ['Cultivo','EspecialistaAgronomo'],
    ['EstadoConservacion','EspecialistaConservacion'],
    ['Preparacion','EspecialistaSalud'],
    ['ParteUso','EspecialistaSalud'],
  ])('%s: el especialista del área correcta (%s) puede aprobar', (tipoEntidad, rolCorrecto) => {
    const v=pendiente(tipoEntidad);
    expect(() => v.aprobar('esp-1', rolCorrecto)).not.toThrow();
    expect(v.props.estado).toBe('Validado');
  });

  test.each([
    ['Cultivo','EspecialistaSalud'],
    ['EstadoConservacion','EspecialistaAgronomo'],
    ['Preparacion','EspecialistaConservacion'],
    ['ParteUso','EspecialistaAgronomo'],
  ])('%s: un especialista de otra área (%s) NO puede aprobar', (tipoEntidad, rolIncorrecto) => {
    const v=pendiente(tipoEntidad);
    expect(() => v.aprobar('esp-1', rolIncorrecto)).toThrow();
  });

  test.each(['Publicacion','Producto'])('%s: sin área asignada -- ningún especialista puede validar, solo Administrador', (tipoEntidad) => {
    const v=pendiente(tipoEntidad);
    expect(() => v.aprobar('esp-1','EspecialistaSalud')).toThrow();
    expect(() => v.aprobar('esp-1','EspecialistaAgronomo')).toThrow();
    expect(() => v.aprobar('esp-1','EspecialistaConservacion')).toThrow();
    const v2=pendiente(tipoEntidad);
    expect(() => v2.aprobar('admin-1','Administrador')).not.toThrow();
  });

  test('Administrador puede validar cualquier tipoEntidad, sin importar el área', () => {
    for (const tipoEntidad of ['Cultivo','EstadoConservacion','Preparacion','ParteUso','Publicacion','Producto']) {
      const v=pendiente(tipoEntidad);
      expect(() => v.aprobar('admin-1','Administrador')).not.toThrow();
    }
  });

  test('observar() y rechazar() aplican la misma restricción de área que aprobar()', () => {
    const v1=pendiente('Cultivo');
    expect(() => v1.observar('esp-1','[DATO DE PRUEBA] falta info','EspecialistaSalud')).toThrow();
    const v2=pendiente('Cultivo');
    expect(() => v2.rechazar('esp-1','[DATO DE PRUEBA] no cumple','EspecialistaSalud')).toThrow();
  });
});

describe('M-13 · Auditoría (RNF-304)', () => {
  test('lista las decisiones ya tomadas (no las pendientes), más recientes primero', async () => {
    const pendiente=new ValidacionContenido({id:'v1',tipoEntidad:'Cultivo',entidadId:'c1',estado:'Pendiente',fecha:new Date('2026-01-01'),autorId:'u1'});
    const antigua=new ValidacionContenido({id:'v2',tipoEntidad:'ParteUso',entidadId:'pu1',estado:'Validado',fecha:new Date('2026-01-02'),autorId:'u1',validadorId:'admin'});
    const reciente=new ValidacionContenido({id:'v3',tipoEntidad:'Publicacion',entidadId:'pub1',estado:'Rechazado',fecha:new Date('2026-01-10'),autorId:'u2',validadorId:'admin',comentarioValidador:'motivo'});
    const repo:any={listar:jest.fn().mockResolvedValue([pendiente,antigua,reciente])};
    const registros=await new ObtenerAuditoriaUseCase(repo).ejecutar();
    expect(registros).toHaveLength(2);
    expect(registros[0].entidadId).toBe('pub1');
    expect(registros[1].entidadId).toBe('pu1');
  });
});

describe('M-14 · Notificaciones (RF-56/195/196/197)', () => {
  function notificacion(overrides:Partial<Notificacion['props']> = {}) { return new Notificacion({id:'n1',usuarioId:'u1',tipo:'comentario_nuevo',mensaje:'[DATO DE PRUEBA] mensaje de prueba',leida:false,fecha:new Date(),...overrides}); }

  test('lista las notificaciones del usuario autenticado (centro de notificaciones)', async () => {
    const repo:any={listarPorUsuario:jest.fn().mockResolvedValue([notificacion()])};
    const notificaciones=await new ListarNotificacionesUseCase(repo).ejecutar('u1');
    expect(notificaciones).toHaveLength(1);
    expect(repo.listarPorUsuario).toHaveBeenCalledWith('u1');
  });
  test('marca todas las notificaciones del usuario como leídas', async () => {
    const repo:any={marcarTodasLeidas:jest.fn()};
    await new MarcarTodasLeidasUseCase(repo).ejecutar('u1');
    expect(repo.marcarTodasLeidas).toHaveBeenCalledWith('u1');
  });
  test('elimina una notificación propia', async () => {
    const repo:any={eliminarDeUsuario:jest.fn()};
    await new EliminarNotificacionUseCase(repo).ejecutar('n1','u1');
    expect(repo.eliminarDeUsuario).toHaveBeenCalledWith('n1','u1');
  });
  test('marca una notificación individual como leída (propia)', async () => {
    const repo:any={marcarLeida:jest.fn()};
    await new MarcarLeidaUseCase(repo).ejecutar('n1','u1');
    expect(repo.marcarLeida).toHaveBeenCalledWith('n1','u1');
  });
});

describe('M-14 · PersistenteNotificadorAdapter (reemplaza al de consola)', () => {
  test('notificar() persiste una notificación real vía el repositorio', async () => {
    const repo:any={guardar:jest.fn()};
    await new PersistenteNotificadorAdapter(repo).notificar('u1','comentario_nuevo');
    expect(repo.guardar).toHaveBeenCalledWith(expect.objectContaining({props:expect.objectContaining({usuarioId:'u1',tipo:'comentario_nuevo',leida:false})}));
  });
});

describe('M-12 · Búsqueda y Recomendaciones', () => {
  function planta(overrides:Partial<Planta['props']> = {}) { return new Planta({id:'p1',nombreComun:'[DATO DE PRUEBA] Manzanilla de prueba',nombreCientifico:'Testus manzanilla',familia:'F',region:'R',habitat:'H',imagenPrincipal:'/uploads/manzanilla.png',...overrides}); }
  function publicacion(overrides:Partial<Publicacion['props']> = {}) { return new Publicacion({id:'pub1',plantaId:'p1',autorId:'u1',nombreComun:'x',descripcion:'[DATO DE PRUEBA] Descripción de prueba de la manzanilla, útil para molestias digestivas leves y para conciliar el sueño de forma natural.',enfermedadesTratadas:'[DATO DE PRUEBA] Molestias digestivas y gripe',formaPreparacion:'x',imagenes:[],tipoConocimiento:'Tradicional',fuente:new Fuente('fuente de prueba'),fechaPublicacion:new Date('2026-01-01'),estadoValidacion:'Validado',...overrides}); }
  function uso(overrides:Partial<Uso['props']> = {}) { return new Uso({id:'uso1',nombre:'Digestivo',...overrides}); }
  function parteUso(overrides:Partial<ParteUso['props']> = {}) { return new ParteUso({id:'pu1',plantaId:'p1',autorId:'u1',parte:'Hoja',usoId:'uso1',tipoConocimiento:'Tradicional',fuente:new Fuente('fuente de prueba'),estadoValidacion:'Validado',...overrides}); }

  test('RF-17: busca plantas por nombre común (parcial, sin distinguir tildes/mayúsculas)', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta(),planta({id:'p2',nombreComun:'[DATO DE PRUEBA] Eucalipto'})])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([])};
    const partesUso:any={listarPorUso:jest.fn()};
    const usos:any={listar:jest.fn()};
    const resultados=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({q:'MANZANILLA'});
    expect(resultados).toHaveLength(1);
    expect(resultados[0].id).toBe('p1');
  });

  test('RF-18/RF-42: busca plantas por enfermedad, usando Publicacion.enfermedadesTratadas ya validada', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta(),planta({id:'p2',nombreComun:'Otra'})])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([publicacion()])};
    const partesUso:any={listarPorUso:jest.fn()};
    const usos:any={listar:jest.fn()};
    const resultados=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({enfermedad:'gripe'});
    expect(resultados).toHaveLength(1);
    expect(resultados[0].id).toBe('p1');
  });

  test('ignora publicaciones de enfermedad que todavía no fueron aprobadas por M-09', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta()])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([publicacion({estadoValidacion:'Pendiente'})])};
    const partesUso:any={listarPorUso:jest.fn()};
    const usos:any={listar:jest.fn()};
    const resultados=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({enfermedad:'gripe'});
    expect(resultados).toHaveLength(0);
  });

  test('RF-110/RF-153: busca por propiedad medicinal / categoría, usando el catálogo Uso de M-04', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta(),planta({id:'p2',nombreComun:'Otra'})])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([])};
    const partesUso:any={listarPorUso:jest.fn().mockResolvedValue([parteUso()])};
    const usos:any={listar:jest.fn().mockResolvedValue([uso()])};
    const resultados=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({propiedad:'digestivo'});
    expect(resultados).toHaveLength(1);
    expect(resultados[0].id).toBe('p1');
    expect(usos.listar).toHaveBeenCalled();
    expect(partesUso.listarPorUso).toHaveBeenCalledWith('uso1');
  });

  test('"categoria" y "propiedad" son el mismo eje: da igual cuál parámetro se use', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta()])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([])};
    const partesUso:any={listarPorUso:jest.fn().mockResolvedValue([parteUso()])};
    const usos:any={listar:jest.fn().mockResolvedValue([uso()])};
    const resultados=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({categoria:'Digestivo'});
    expect(resultados).toHaveLength(1);
  });

  test('ignora combinaciones Parte+Uso todavía no validadas al filtrar por categoría', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta()])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([])};
    const partesUso:any={listarPorUso:jest.fn().mockResolvedValue([parteUso({estadoValidacion:'Pendiente'})])};
    const usos:any={listar:jest.fn().mockResolvedValue([uso()])};
    const resultados=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({categoria:'Digestivo'});
    expect(resultados).toHaveLength(0);
  });

  test('devuelve vacío si la categoría no existe en el catálogo (no inventa coincidencias)', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta()])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([])};
    const partesUso:any={listarPorUso:jest.fn()};
    const usos:any={listar:jest.fn().mockResolvedValue([uso()])};
    const resultados=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({categoria:'Categoría inexistente'});
    expect(resultados).toHaveLength(0);
    expect(partesUso.listarPorUso).not.toHaveBeenCalled();
  });

  test('combina varios criterios a la vez (AND): nombre + categoría', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta(),planta({id:'p2',nombreComun:'[DATO DE PRUEBA] Manzanilla silvestre'})])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([])};
    // Solo p1 tiene la combinación Parte+Uso validada para "Digestivo".
    const partesUso:any={listarPorUso:jest.fn().mockResolvedValue([parteUso({plantaId:'p1'})])};
    const usos:any={listar:jest.fn().mockResolvedValue([uso()])};
    const resultados=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({q:'manzanilla',categoria:'Digestivo'});
    expect(resultados).toHaveLength(1);
    expect(resultados[0].id).toBe('p1');
  });

  test('RF-20: cada resultado trae imagen, nombre y una descripción breve tomada de la publicación validada más reciente', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta()])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([publicacion()])};
    const partesUso:any={listarPorUso:jest.fn()};
    const usos:any={listar:jest.fn()};
    const [resultado]=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({});
    expect(resultado.imagenPrincipal).toBe('/uploads/manzanilla.png');
    expect(resultado.descripcionBreve).toMatch(/DATO DE PRUEBA/);
  });
  test('descripcionBreve es null cuando la planta no tiene ninguna publicación validada', async () => {
    const plantas:any={listar:jest.fn().mockResolvedValue([planta()])};
    const publicaciones:any={listar:jest.fn().mockResolvedValue([publicacion({estadoValidacion:'Pendiente'})])};
    const partesUso:any={listarPorUso:jest.fn()};
    const usos:any={listar:jest.fn()};
    const [resultado]=await new BuscarPlantasUseCase(plantas,publicaciones,partesUso,usos).ejecutar({});
    expect(resultado.descripcionBreve).toBeNull();
  });
});

describe('M-08 · Consultas y Soporte (RF-263/264/265/266, RN-06, RNF-302)', () => {
  function consulta(overrides:Partial<Consulta['props']> = {}) {
    return new Consulta({id:'c1',autorId:'u1',tipo:'PreguntaGeneral',descripcion:'[DATO DE PRUEBA] descripción de prueba',estado:'Pendiente',prioridad:'Normal',fechaCreacion:new Date('2026-01-01T00:00:00Z'),fechaActualizacion:new Date('2026-01-01T00:00:00Z'),...overrides});
  }

  describe('CrearConsultaUseCase', () => {
    test('RN-06: "reporte de planta en peligro" sale con prioridad Alta automáticamente', async () => {
      const repo:any={guardar:jest.fn()};
      const creada=await new CrearConsultaUseCase(repo).ejecutar({tipo:'ReportePlantaEnPeligro',descripcion:'[DATO DE PRUEBA] hay una planta en peligro'});
      expect(creada.props.prioridad).toBe('Alta');
      expect(repo.guardar).toHaveBeenCalled();
    });
    test('RN-06: "reporte de información incorrecta" también sale con prioridad Alta', async () => {
      const repo:any={guardar:jest.fn()};
      const creada=await new CrearConsultaUseCase(repo).ejecutar({tipo:'ReporteInformacionIncorrecta',descripcion:'[DATO DE PRUEBA] esto es incorrecto'});
      expect(creada.props.prioridad).toBe('Alta');
    });
    test('el resto de los tipos sale con prioridad Normal (nadie la marca a mano)', async () => {
      const repo:any={guardar:jest.fn()};
      const creada=await new CrearConsultaUseCase(repo).ejecutar({tipo:'PreguntaGeneral',descripcion:'[DATO DE PRUEBA] pregunta'});
      expect(creada.props.prioridad).toBe('Normal');
    });
    test('enrutamiento: "reporte de planta en peligro" -> área Conservación', async () => {
      const repo:any={guardar:jest.fn()};
      const creada=await new CrearConsultaUseCase(repo).ejecutar({tipo:'ReportePlantaEnPeligro',descripcion:'[DATO DE PRUEBA] x'});
      expect(creada.props.areaAsignada).toBe('Conservacion');
    });
    test('enrutamiento: "reporte de problema de cultivo" -> área Agronomía', async () => {
      const repo:any={guardar:jest.fn()};
      const creada=await new CrearConsultaUseCase(repo).ejecutar({tipo:'ReporteProblemaCultivo',descripcion:'[DATO DE PRUEBA] x'});
      expect(creada.props.areaAsignada).toBe('Agronomia');
    });
    test('sin mapeo obvio tipo->área, queda sin área asignada (no se inventa una regla)', async () => {
      const repo:any={guardar:jest.fn()};
      const creada=await new CrearConsultaUseCase(repo).ejecutar({tipo:'ConsultaSobrePublicacion',descripcion:'[DATO DE PRUEBA] x'});
      expect(creada.props.areaAsignada).toBeUndefined();
    });
    test('RF-263: un visitante sin cuenta puede crear una consulta general sin autorId', async () => {
      const repo:any={guardar:jest.fn()};
      const creada=await new CrearConsultaUseCase(repo).ejecutar({tipo:'PreguntaGeneral',descripcion:'[DATO DE PRUEBA] x'});
      expect(creada.props.autorId).toBeUndefined();
      expect(creada.props.estado).toBe('Pendiente');
    });
    test('rechaza un tipo no reconocido', async () => {
      const repo:any={guardar:jest.fn()};
      await expect(new CrearConsultaUseCase(repo).ejecutar({tipo:'TipoInventado',descripcion:'x'})).rejects.toThrow();
    });
    test('rechaza una descripción vacía', async () => {
      const repo:any={guardar:jest.fn()};
      await expect(new CrearConsultaUseCase(repo).ejecutar({tipo:'PreguntaGeneral',descripcion:'   '})).rejects.toThrow();
    });
  });

  describe('ListarBandejaConsultasUseCase (RF-264)', () => {
    test('rechaza a quien no es administrador ni especialista', async () => {
      const repo:any={listar:jest.fn()};
      await expect(new ListarBandejaConsultasUseCase(repo).ejecutar('UsuarioRegistrado',{})).rejects.toThrow();
    });
    test('Administrador ve consultas de cualquier área', async () => {
      const repo:any={listar:jest.fn().mockResolvedValue([consulta({id:'a',areaAsignada:'Salud'}),consulta({id:'b',areaAsignada:'Conservacion'})])};
      const resultado=await new ListarBandejaConsultasUseCase(repo).ejecutar('Administrador',{});
      expect(resultado).toHaveLength(2);
    });
    test('un especialista solo ve su propia área y las que no tienen área asignada (mismo principio de RN-05)', async () => {
      const repo:any={listar:jest.fn().mockResolvedValue([
        consulta({id:'propia',areaAsignada:'Conservacion'}),
        consulta({id:'ajena',areaAsignada:'Salud'}),
        consulta({id:'sin-area',areaAsignada:undefined}),
      ])};
      const resultado=await new ListarBandejaConsultasUseCase(repo).ejecutar('EspecialistaConservacion',{});
      expect(resultado.map((c:Consulta)=>c.props.id).sort()).toEqual(['propia','sin-area']);
    });
    test('si un especialista filtra explícitamente por un área ajena, no ve nada (no un error)', async () => {
      const repo:any={listar:jest.fn().mockResolvedValue([consulta({areaAsignada:'Salud'})])};
      const resultado=await new ListarBandejaConsultasUseCase(repo).ejecutar('EspecialistaConservacion',{area:'Salud'});
      expect(resultado).toHaveLength(0);
    });
  });

  describe('ListarMisConsultasUseCase', () => {
    test('precondición: exige cuenta activa', async () => {
      const repo:any={listarPorAutor:jest.fn()};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(new Usuario({id:'u1',nombre:'x',correo:'x@example.com',contraseñaHash:'',rol:'UsuarioRegistrado',idioma:'es',nivelConocimiento:'Pendiente',region:'Pendiente',estado:'PendienteActivacion'}))};
      await expect(new ListarMisConsultasUseCase(repo,usuarios).ejecutar('u1')).rejects.toThrow();
    });
    test('devuelve el historial completo del autor si la cuenta está activa', async () => {
      const repo:any={listarPorAutor:jest.fn().mockResolvedValue([consulta()])};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(new Usuario({id:'u1',nombre:'x',correo:'x@example.com',contraseñaHash:'',rol:'UsuarioRegistrado',idioma:'es',nivelConocimiento:'Pendiente',region:'Pendiente',estado:'Activo'}))};
      const resultado=await new ListarMisConsultasUseCase(repo,usuarios).ejecutar('u1');
      expect(resultado).toHaveLength(1);
      expect(repo.listarPorAutor).toHaveBeenCalledWith('u1');
    });
  });

  describe('ObtenerConsultaUseCase (RF-266, control de acceso)', () => {
    test('el autor puede ver su propia consulta', async () => {
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(consulta({autorId:'u1'}))};
      const mensajes:any={listarPorConsulta:jest.fn().mockResolvedValue([])};
      const {consulta:vista}=await new ObtenerConsultaUseCase(repo,mensajes).ejecutar('c1','u1','UsuarioRegistrado');
      expect(vista.props.id).toBe('c1');
    });
    test('un tercero sin rol de equipo no puede ver la consulta de otro', async () => {
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(consulta({autorId:'u1'}))};
      const mensajes:any={listarPorConsulta:jest.fn()};
      await expect(new ObtenerConsultaUseCase(repo,mensajes).ejecutar('c1','otro-usuario','UsuarioRegistrado')).rejects.toThrow();
    });
    test('un especialista de un área distinta no puede ver una consulta asignada a otra área', async () => {
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(consulta({autorId:'u1',areaAsignada:'Salud'}))};
      const mensajes:any={listarPorConsulta:jest.fn()};
      await expect(new ObtenerConsultaUseCase(repo,mensajes).ejecutar('c1','especialista-1','EspecialistaConservacion')).rejects.toThrow();
    });
    test('un especialista sí puede ver una consulta sin área asignada', async () => {
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(consulta({autorId:'u1',areaAsignada:undefined}))};
      const mensajes:any={listarPorConsulta:jest.fn().mockResolvedValue([])};
      const {consulta:vista}=await new ObtenerConsultaUseCase(repo,mensajes).ejecutar('c1','especialista-1','EspecialistaConservacion');
      expect(vista.props.id).toBe('c1');
    });
  });

  describe('AgregarMensajeConsultaUseCase (RF-266)', () => {
    test('un mensaje del propio autor no cambia el estado ni notifica', async () => {
      const c=consulta({autorId:'u1',estado:'Pendiente'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c),actualizar:jest.fn()};
      const mensajes:any={guardar:jest.fn()};
      const notificador:any={notificar:jest.fn()};
      await new AgregarMensajeConsultaUseCase(repo,mensajes,notificador).ejecutar({consultaId:'c1',autorId:'u1',rolAutor:'UsuarioRegistrado',contenido:'[DATO DE PRUEBA] hola'});
      expect(c.props.estado).toBe('Pendiente');
      expect(notificador.notificar).not.toHaveBeenCalled();
    });
    test('el primer mensaje del equipo pasa Pendiente -> EnRevision, registra la fecha de primera respuesta (RNF-302) y notifica', async () => {
      const c=consulta({autorId:'u1',estado:'Pendiente'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c),actualizar:jest.fn()};
      const mensajes:any={guardar:jest.fn()};
      const notificador:any={notificar:jest.fn()};
      await new AgregarMensajeConsultaUseCase(repo,mensajes,notificador).ejecutar({consultaId:'c1',autorId:'admin-1',rolAutor:'Administrador',contenido:'[DATO DE PRUEBA] estamos revisando'});
      expect(c.props.estado).toBe('EnRevision');
      expect(c.props.fechaPrimeraRespuestaEquipo).toBeDefined();
      expect(notificador.notificar).toHaveBeenCalledWith('u1','consulta_en_revision',{entidadTipo:'Consulta',entidadId:'c1'});
    });
    test('un segundo mensaje del equipo pasa EnRevision -> Respondida y notifica', async () => {
      const c=consulta({autorId:'u1',estado:'EnRevision',fechaPrimeraRespuestaEquipo:new Date('2026-01-01T01:00:00Z')});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c),actualizar:jest.fn()};
      const mensajes:any={guardar:jest.fn()};
      const notificador:any={notificar:jest.fn()};
      await new AgregarMensajeConsultaUseCase(repo,mensajes,notificador).ejecutar({consultaId:'c1',autorId:'admin-1',rolAutor:'Administrador',contenido:'[DATO DE PRUEBA] aquí está la respuesta'});
      expect(c.props.estado).toBe('Respondida');
      expect(notificador.notificar).toHaveBeenCalledWith('u1','consulta_respondida',{entidadTipo:'Consulta',entidadId:'c1'});
    });
    test('no notifica si la consulta es de un visitante sin autorId', async () => {
      const c=consulta({autorId:undefined,estado:'Pendiente'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c),actualizar:jest.fn()};
      const mensajes:any={guardar:jest.fn()};
      const notificador:any={notificar:jest.fn()};
      await new AgregarMensajeConsultaUseCase(repo,mensajes,notificador).ejecutar({consultaId:'c1',autorId:'admin-1',rolAutor:'Administrador',contenido:'[DATO DE PRUEBA] x'});
      expect(notificador.notificar).not.toHaveBeenCalled();
    });
    test('bloquea agregar un mensaje si la consulta está Cerrada (hay que reabrirla primero)', async () => {
      const c=consulta({autorId:'u1',estado:'Cerrada'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c),actualizar:jest.fn()};
      const mensajes:any={guardar:jest.fn()};
      const notificador:any={notificar:jest.fn()};
      await expect(new AgregarMensajeConsultaUseCase(repo,mensajes,notificador).ejecutar({consultaId:'c1',autorId:'u1',rolAutor:'UsuarioRegistrado',contenido:'x'})).rejects.toThrow();
    });
    test('rechaza contenido vacío', async () => {
      const c=consulta({autorId:'u1'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c)};
      const mensajes:any={guardar:jest.fn()};
      const notificador:any={notificar:jest.fn()};
      await expect(new AgregarMensajeConsultaUseCase(repo,mensajes,notificador).ejecutar({consultaId:'c1',autorId:'u1',rolAutor:'UsuarioRegistrado',contenido:'  '})).rejects.toThrow();
    });
  });

  describe('CerrarConsultaUseCase / ReabrirConsultaUseCase', () => {
    test('cierra una consulta abierta', async () => {
      // fechaActualizacion reciente (no la del helper, fija en 2026-01-01) -- si no, el cierre
      // perezoso por inactividad (RF-266, 7 días) la cerraría antes de que este test llegue a
      // ejercitar el cierre MANUAL, que es lo que este test verifica.
      const c=consulta({autorId:'u1',estado:'Respondida',fechaActualizacion:new Date()});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c),actualizar:jest.fn()};
      const cerrada=await new CerrarConsultaUseCase(repo).ejecutar('c1','u1','UsuarioRegistrado');
      expect(cerrada.props.estado).toBe('Cerrada');
    });
    test('rechaza cerrar una consulta ya cerrada', async () => {
      const c=consulta({autorId:'u1',estado:'Cerrada'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c)};
      await expect(new CerrarConsultaUseCase(repo).ejecutar('c1','u1','UsuarioRegistrado')).rejects.toThrow();
    });
    test('reabre una consulta cerrada, vuelve a Pendiente', async () => {
      const c=consulta({autorId:'u1',estado:'Cerrada'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c),actualizar:jest.fn()};
      const reabierta=await new ReabrirConsultaUseCase(repo).ejecutar('c1','u1','UsuarioRegistrado');
      expect(reabierta.props.estado).toBe('Pendiente');
    });
    test('rechaza reabrir una consulta que no está cerrada', async () => {
      const c=consulta({autorId:'u1',estado:'Pendiente'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c)};
      await expect(new ReabrirConsultaUseCase(repo).ejecutar('c1','u1','UsuarioRegistrado')).rejects.toThrow();
    });
  });

  describe('Cierre automático por inactividad (RF-266, 7 días, resuelto de forma perezosa)', () => {
    test('Consulta.cerrarPorInactividadSiCorresponde: no hace nada si no está en "Respondida"', () => {
      const c=consulta({estado:'EnRevision',fechaActualizacion:new Date('2020-01-01')});
      expect(c.cerrarPorInactividadSiCorresponde(new Date())).toBe(false);
      expect(c.props.estado).toBe('EnRevision');
    });
    test('Consulta.cerrarPorInactividadSiCorresponde: no cierra si todavía no pasaron 7 días', () => {
      const ahora=new Date('2026-01-10T00:00:00Z');
      const c=consulta({estado:'Respondida',fechaActualizacion:new Date('2026-01-05T00:00:00Z')});
      expect(c.cerrarPorInactividadSiCorresponde(ahora)).toBe(false);
      expect(c.props.estado).toBe('Respondida');
    });
    test('Consulta.cerrarPorInactividadSiCorresponde: cierra al cumplirse (o superar) los 7 días', () => {
      const ahora=new Date('2026-01-08T00:00:01Z');
      const c=consulta({estado:'Respondida',fechaActualizacion:new Date('2026-01-01T00:00:00Z')});
      expect(c.cerrarPorInactividadSiCorresponde(ahora)).toBe(true);
      expect(c.props.estado).toBe('Cerrada');
    });
    test('ObtenerConsultaUseCase: una consulta Respondida y vieja se ve ya Cerrada, y el cambio se persiste', async () => {
      const c=consulta({autorId:'u1',estado:'Respondida',fechaActualizacion:new Date('2020-01-01')});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c),actualizar:jest.fn()};
      const mensajes:any={listarPorConsulta:jest.fn().mockResolvedValue([])};
      const {consulta:vista}=await new ObtenerConsultaUseCase(repo,mensajes).ejecutar('c1','u1','UsuarioRegistrado');
      expect(vista.props.estado).toBe('Cerrada');
      expect(repo.actualizar).toHaveBeenCalledWith(c);
    });
    test('ListarBandejaConsultasUseCase: cierra las Respondida vencidas antes de devolver la lista', async () => {
      const vieja=consulta({id:'vieja',estado:'Respondida',fechaActualizacion:new Date('2020-01-01')});
      const reciente=consulta({id:'reciente',estado:'Respondida',fechaActualizacion:new Date()});
      const repo:any={listar:jest.fn().mockResolvedValue([vieja,reciente]),actualizar:jest.fn()};
      const resultado=await new ListarBandejaConsultasUseCase(repo).ejecutar('Administrador',{});
      expect(resultado.find((c:Consulta)=>c.props.id==='vieja')?.props.estado).toBe('Cerrada');
      expect(resultado.find((c:Consulta)=>c.props.id==='reciente')?.props.estado).toBe('Respondida');
      expect(repo.actualizar).toHaveBeenCalledTimes(1);
    });
    test('ListarMisConsultasUseCase: también aplica el cierre perezoso al listar el historial propio', async () => {
      const vieja=consulta({id:'vieja',estado:'Respondida',fechaActualizacion:new Date('2020-01-01')});
      const repo:any={listarPorAutor:jest.fn().mockResolvedValue([vieja]),actualizar:jest.fn()};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(new Usuario({id:'u1',nombre:'x',correo:'x@example.com',contraseñaHash:'',rol:'UsuarioRegistrado',idioma:'es',nivelConocimiento:'Pendiente',region:'Pendiente',estado:'Activo'}))};
      const resultado=await new ListarMisConsultasUseCase(repo,usuarios).ejecutar('u1');
      expect(resultado[0].props.estado).toBe('Cerrada');
      expect(repo.actualizar).toHaveBeenCalled();
    });
  });

  describe('AsignarConsultaUseCase (asignación manual, solo Administrador)', () => {
    test('un administrador asigna la consulta a un especialista del equipo', async () => {
      const c=consulta({autorId:'u1'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c),actualizar:jest.fn()};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(new Usuario({id:'esp-1',nombre:'Especialista Uno',correo:'e@example.com',contraseñaHash:'',rol:'EspecialistaSalud',idioma:'es',nivelConocimiento:'Pendiente',region:'Pendiente',estado:'Activo'}))};
      const asignada=await new AsignarConsultaUseCase(repo,usuarios).ejecutar('c1','esp-1','admin-1','Administrador');
      expect(asignada.props.asignadoA).toBe('esp-1');
      expect(repo.actualizar).toHaveBeenCalled();
    });
    test('rechaza si quien pide asignar no es Administrador (un especialista no se autoasigna)', async () => {
      const c=consulta({autorId:'u1'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c)};
      const usuarios:any={buscarPorId:jest.fn()};
      await expect(new AsignarConsultaUseCase(repo,usuarios).ejecutar('c1','esp-1','esp-1','EspecialistaSalud')).rejects.toThrow();
      expect(usuarios.buscarPorId).not.toHaveBeenCalled();
    });
    test('rechaza asignar a alguien que no es parte del equipo (ni Especialista_* ni Administrador)', async () => {
      const c=consulta({autorId:'u1'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c)};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(new Usuario({id:'u2',nombre:'Visitante cualquiera',correo:'v@example.com',contraseñaHash:'',rol:'UsuarioRegistrado',idioma:'es',nivelConocimiento:'Pendiente',region:'Pendiente',estado:'Activo'}))};
      await expect(new AsignarConsultaUseCase(repo,usuarios).ejecutar('c1','u2','admin-1','Administrador')).rejects.toThrow();
    });
    test('rechaza asignar a un id de usuario que no existe', async () => {
      const c=consulta({autorId:'u1'});
      const repo:any={buscarPorId:jest.fn().mockResolvedValue(c)};
      const usuarios:any={buscarPorId:jest.fn().mockResolvedValue(null)};
      await expect(new AsignarConsultaUseCase(repo,usuarios).ejecutar('c1','no-existe','admin-1','Administrador')).rejects.toThrow();
    });
  });
});
