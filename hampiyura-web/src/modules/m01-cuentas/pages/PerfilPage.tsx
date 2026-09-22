import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { obtenerPerfil, cambiarContrasena, type Perfil } from '../api/cuentas.api';
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
                <FilaPerfil etiqueta="Región" valor={perfil.region || 'Sin especificar'} />
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
