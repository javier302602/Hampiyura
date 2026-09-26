import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { obtenerPerfil, cambiarContrasena, actualizarPerfil, type Perfil } from '../api/cuentas.api';
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
  const esProductor = perfil.rol === 'Productor';
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
