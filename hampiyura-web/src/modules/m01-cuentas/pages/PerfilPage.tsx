import DisponibilidadProductor from "../../m15-planes/components/DisponibilidadProductor";
import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { obtenerPerfil, cambiarContrasena, actualizarPerfil, obtenerMiTipoCuenta, solicitarTipoCuenta, TIPOS_CUENTA, type MiTipoCuenta, type TipoCuentaSolicitable, type Perfil } from '../api/cuentas.api';
import ReglasContrasena, { contraseñaEsSegura } from '../components/ReglasContrasena';
import { Avatar, Badge, Button, Card, ErrorState, LoadingState, SectionHeader } from '../../../shared/ui';
import type { BadgeVariant } from '../../../shared/ui/Badge';

const ETIQUETA_ROL: Record<string, string> = {
  Visitante: 'Visitante',
  UsuarioRegistrado: 'Usuario registrado',
  PortadorConocimiento: 'Portador de conocimiento',
  EspecialistaAgronomo: 'Especialista en agronomía',
  EspecialistaConservacion: 'Especialista en conservación',
  EspecialistaSalud: 'Especialista en salud',
  Productor: 'Productor',
  Administrador: 'Administrador',
};

const ESTADO_CUENTA: Record<string, { etiqueta: string; variant: BadgeVariant }> = {
  Activo: { etiqueta: 'Cuenta activa', variant: 'success' },
  PendienteActivacion: { etiqueta: 'Pendiente de activación', variant: 'warning' },
  Suspendido: { etiqueta: 'Suspendida', variant: 'danger' },
};

// Campos básicos: teléfono, ubicación/región, biografía corta y, para Productor, el nombre de su negocio.
// El teléfono y el nombre del negocio son lo que otras personas ven cuando desbloquean tu contacto (M-15).
function FormularioEditarPerfil({ perfil, onGuardado }: { perfil: Perfil; onGuardado: (p: Perfil) => void }) {
  const esProductor = perfil.rol === 'Productor' || !!perfil.tipoCuenta;
  const [telefono, setTelefono] = useState(perfil.telefono ?? '');
  const [region, setRegion] = useState(perfil.region === 'Pendiente' ? '' : perfil.region);
  const [biografia, setBiografia] = useState(perfil.biografia ?? '');
  const [nombreNegocio, setNombreNegocio] = useState(perfil.nombreNegocio ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true); setError(null); setGuardado(false);
    try {
      const nuevo = await actualizarPerfil({ telefono, region, biografia, ...(esProductor ? { nombreNegocio } : {}) });
      onGuardado(nuevo);
      setGuardado(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar tu perfil.'); }
    finally { setGuardando(false); }
  }

  return (
    <form onSubmit={guardar} className="formulario" style={{ maxWidth: 'none', padding: 0, border: 'none', background: 'none', boxShadow: 'none', marginTop: 0 }}>
      {esProductor && (
        <label>
          Nombre de tu empresa o negocio
          <input type="text" value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} maxLength={80} placeholder="Ej. Huerta Ana Quispe" />
        </label>
      )}
      <label>
        Teléfono / WhatsApp
        <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={20} placeholder="Ej. +51 987 654 321" />
      </label>
      <label>
        Ubicación / región
        <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} maxLength={120} placeholder="Ej. Tingo María, Huánuco" />
      </label>
      <label>
        Biografía corta
        <textarea value={biografia} onChange={(e) => setBiografia(e.target.value)} maxLength={300} placeholder="Cuenta en pocas palabras quién eres y qué haces." />
        <span className="comentario-meta">{biografia.length}/300</span>
      </label>
      {esProductor && <p className="comentario-meta">Tu teléfono y el nombre de tu negocio los ven quienes tengan un plan activo o desbloqueen tu contacto. No los ve el público general.</p>}
      {error && <p className="error-formulario" role="alert">{error}</p>}
      {guardado && <p className="sello-verificado" role="status">✔ Perfil guardado.</p>}
      <Button type="submit" variant="primary" loading={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Button>
    </form>
  );
}

const ESTADO_SOLICITUD: Record<string, { etiqueta: string; variant: BadgeVariant }> = {
  Pendiente: { etiqueta: 'Pendiente de aprobación', variant: 'warning' },
  EnRevision: { etiqueta: 'En revisión', variant: 'warning' },
  Observado: { etiqueta: 'El equipo dejó una observación', variant: 'warning' },
  Validado: { etiqueta: 'Aprobada', variant: 'success' },
  Rechazado: { etiqueta: 'Rechazada', variant: 'danger' },
};

// Pedir el cambio a Productor / Empresario / Institución de investigación. No se aplica solo: queda pendiente y lo decide
// un administrador. El plan que le corresponde sale del catálogo de planes (M-15); aprobar el tipo no regala el plan.
function TarjetaTipoCuenta({ onCambio }: { onCambio: () => void }) {
  const [estado, setEstado] = useState<MiTipoCuenta | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoCuentaSolicitable>('Productor');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cargar() { obtenerMiTipoCuenta().then(setEstado).catch(() => setEstado(null)); }
  useEffect(cargar, []);

  const def = TIPOS_CUENTA.find((t) => t.valor === tipo)!;
  const pideNombre = tipo !== 'Productor';
  const etiquetaNombre = tipo === 'Institucion' ? 'Nombre de la institución' : tipo === 'Empresario' ? 'Nombre de tu empresa' : 'Nombre de tu empresa o negocio (opcional)';
  const etiquetaDescripcion = tipo === 'Institucion' ? 'Qué investiga o a qué se dedica' : tipo === 'Empresario' ? 'A qué se dedica tu empresa' : 'Qué produces';

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true); setError(null);
    try {
      await solicitarTipoCuenta({ tipo, nombreOrganizacion: nombre.trim() || undefined, descripcion, identificacion: identificacion.trim() || undefined, sitioWeb: sitioWeb.trim() || undefined });
      setAbierto(false); setNombre(''); setDescripcion(''); setIdentificacion(''); setSitioWeb('');
      cargar(); onCambio();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.'); }
    finally { setEnviando(false); }
  }

  if (!estado) return null;
  const s = estado.solicitud;
  // Quien ya es del equipo (o ya tiene tipo) no ve el formulario: solo su estado.
  if (!estado.puedeSolicitar && !s && !estado.tipoCuenta) return null;

  return (
    <Card>
      <div className="card-ui-body">
        <h3 className="perfil-nombre">Tipo de cuenta</h3>
        {estado.tipoCuenta && <p className="perfil-correo">Tu cuenta está aprobada como <strong>{TIPOS_CUENTA.find((t) => t.valor === estado.tipoCuenta)?.etiqueta}</strong>.</p>}
        {s && (
          <div style={{ display: 'grid', gap: '.5rem', marginBottom: '.75rem' }}>
            <div className="perfil-badges">
              <Badge variant={ESTADO_SOLICITUD[s.estado]?.variant ?? 'neutral'}>{ESTADO_SOLICITUD[s.estado]?.etiqueta ?? s.estado}</Badge>
              <span className="perfil-correo">Solicitud: {s.etiquetaTipo} · {new Date(s.creadaEn).toLocaleDateString('es-PE')}</span>
            </div>
            {s.comentarioDelEquipo && <p className="comentario-meta">Comentario del equipo: {s.comentarioDelEquipo}</p>}
          </div>
        )}
        {estado.puedeSolicitar && !abierto && (
          <>
            {!s && <p className="perfil-correo">Tu cuenta es de usuario normal (gratis). Si produces, tienes un negocio o representas a una institución, puedes pedir el cambio: un administrador lo revisa. Es gratis y no depende de ningún plan de pago.</p>}
            <Button variant="secondary" onClick={() => setAbierto(true)}>{s ? 'Enviar una nueva solicitud' : 'Solicitar cambio de tipo de cuenta'}</Button>
          </>
        )}
        {estado.puedeSolicitar && abierto && (
          <form onSubmit={enviar} className="formulario" style={{ maxWidth: 'none', padding: 0, border: 'none', background: 'none', boxShadow: 'none', marginTop: 0 }}>
            <label>
              Quiero una cuenta de tipo
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCuentaSolicitable)}>
                {TIPOS_CUENTA.map((t) => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
              </select>
              <span className="comentario-meta">{def.ayuda}</span>
            </label>
            <label>
              {etiquetaNombre}
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} required={pideNombre} />
            </label>
            <label>
              {etiquetaDescripcion}
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={600} required minLength={20} />
              <span className="comentario-meta">{descripcion.length}/600 (mínimo 20)</span>
            </label>
            <label>
              RUC u otro documento (opcional)
              <input type="text" value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} maxLength={40} />
            </label>
            <label>
              Sitio web (opcional)
              <input type="url" value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} placeholder="https://" />
            </label>
            {error && <p className="error-formulario" role="alert">{error}</p>}
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <Button type="submit" variant="primary" loading={enviando}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</Button>
              <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>Cancelar</Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}

function FormularioCambiarContrasena() {
  const [contraseñaActual, setContraseñaActual] = useState('');
  const [contraseñaNueva, setContraseñaNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contraseñaEsSegura(contraseñaNueva)) { setError('La contraseña nueva todavía no cumple los requisitos de seguridad.'); return; }
    if (contraseñaNueva !== confirmacion) { setError('La confirmación no coincide.'); return; }
    setEnviando(true);
    setError(null);
    setExito(false);
    try {
      await cambiarContrasena(contraseñaActual, contraseñaNueva, confirmacion);
      setContraseñaActual(''); setContraseñaNueva(''); setConfirmacion('');
      setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario">
      <label>
        Contraseña actual
        <input type="password" value={contraseñaActual} onChange={(e) => setContraseñaActual(e.target.value)} required />
      </label>
      <label>
        Contraseña nueva
        <input type="password" value={contraseñaNueva} onChange={(e) => setContraseñaNueva(e.target.value)} required />
      </label>
      <ReglasContrasena contraseña={contraseñaNueva} />
      <label>
        Confirmar contraseña nueva
        <input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required />
      </label>
      {exito && <p className="sello-verificado">✔ Contraseña actualizada correctamente.</p>}
      {error && <p className="error-formulario">{error}</p>}
      <Button type="submit" variant="primary" loading={enviando} disabled={!contraseñaEsSegura(contraseñaNueva) || contraseñaNueva !== confirmacion}>
        Cambiar contraseña
      </Button>
    </form>
  );
}

function FilaPerfil({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="perfil-fila">
      <span className="perfil-fila-etiqueta">{etiqueta}</span>
      <span className="perfil-fila-valor">{valor}</span>
    </div>
  );
}

function PerfilPage({ onVolver }: { onVolver: () => void }) {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerPerfil().then(setPerfil).catch(() => setError('No se pudo cargar tu perfil.')).finally(() => setCargando(false));
  }, []);

  return (
    <section>
      <Button variant="ghost" iconLeft={<ArrowLeft size={16} aria-hidden="true" />} onClick={onVolver}>Volver al catálogo</Button>
      <SectionHeader eyebrow="Mi cuenta" title="Mi perfil" description="Tus datos, tu rol dentro de la comunidad y la seguridad de tu cuenta." />

      {cargando && <LoadingState label="Cargando tu perfil" />}
      {error && <ErrorState description={error} />}

      {perfil && (
        <div className="perfil-grid">
          <Card className="perfil-tarjeta-principal">
            <div className="card-ui-body">
              <div className="perfil-encabezado">
                <Avatar nombre={perfil.nombre} />
                <div>
                  <h3 className="perfil-nombre">{perfil.nombre}</h3>
                  <p className="perfil-correo">{perfil.correo}</p>
                </div>
              </div>
              <div className="perfil-badges">
                <Badge variant="accent" icon={<ShieldCheck size={14} aria-hidden="true" />}>{ETIQUETA_ROL[perfil.rol] ?? perfil.rol}</Badge>
                <Badge variant={ESTADO_CUENTA[perfil.estado]?.variant ?? 'neutral'}>{ESTADO_CUENTA[perfil.estado]?.etiqueta ?? perfil.estado}</Badge>
              </div>
              <div className="perfil-filas">
                {perfil.nombreNegocio && <FilaPerfil etiqueta="Negocio" valor={perfil.nombreNegocio} />}
                <FilaPerfil etiqueta="Teléfono" valor={perfil.telefono || 'Sin especificar'} />
                <FilaPerfil etiqueta="Región" valor={perfil.region && perfil.region !== 'Pendiente' ? perfil.region : 'Sin especificar'} />
                {perfil.biografia && <FilaPerfil etiqueta="Biografía" valor={perfil.biografia} />}
                <FilaPerfil etiqueta="Idioma" valor={perfil.idioma || 'Sin especificar'} />
                <FilaPerfil etiqueta="Nivel de conocimiento" valor={perfil.nivelConocimiento || 'Sin especificar'} />
                {perfil.aceptoComisionEn && (
                  <FilaPerfil etiqueta="Comisión de venta (5%)" valor={`Aceptada el ${new Date(perfil.aceptoComisionEn).toLocaleDateString('es-PE')}`} />
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="card-ui-body">
              <h3 className="perfil-nombre">Editar mis datos</h3>
              <FormularioEditarPerfil perfil={perfil} onGuardado={setPerfil} />
            </div>
          </Card>

          {perfil.rol === 'Productor' && (
            <Card>
              <div className="card-ui-body"><DisponibilidadProductor /></div>
            </Card>
          )}

          <TarjetaTipoCuenta onCambio={() => obtenerPerfil().then(setPerfil).catch(() => {})} />

          <Card>
            <div className="card-ui-body">
              <h3 className="perfil-nombre">Mi plan</h3>
              <p className="perfil-correo">Consulta tu plan, los contactos que desbloqueaste y el estado de tus pagos.</p>
              <Button variant="secondary" onClick={() => navigate('/m15-planes/mi-plan')}>Ver mi plan y mis pagos</Button>
            </div>
          </Card>

          <Card>
            <div className="card-ui-body">
              <h3 className="perfil-nombre">Cambiar contraseña</h3>
              <FormularioCambiarContrasena />
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}

export default PerfilPage;
