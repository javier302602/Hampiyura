import { FormEvent, useState } from 'react';
import { registrar } from '../api/cuentas.api';
import ReglasContrasena, { contraseñaEsSegura } from '../components/ReglasContrasena';
import Button from '../../../shared/ui/Button';
import AuthLayout from '../components/AuthLayout';

interface Props {
  onIrALogin: () => void;
  onIrAActivar: () => void;
}

// Dos caminos de registro (ver RegistrarUsuarioUseCase en el backend): personal queda Activo de
// inmediato (sin fricción, CG-005); empresa/emprendimiento crea una cuenta Productor que necesita
// activarse con el token que llega por correo (en desarrollo, log de consola) antes de poder
// publicar productos.
function RegistroPage({ onIrALogin, onIrAActivar }: Props) {
  const [tipoRegistro, setTipoRegistro] = useState<'personal' | 'empresa'>('personal');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrado, setRegistrado] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contraseñaEsSegura(contraseña)) { setError('La contraseña todavía no cumple los requisitos de seguridad.'); return; }
    if (contraseña !== confirmacion) { setError('La confirmación de contraseña no coincide.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await registrar({ nombre, correo, contraseña, contraseñaConfirmacion: confirmacion, tipoRegistro });
      setRegistrado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    } finally {
      setEnviando(false);
    }
  }

  if (registrado) {
    return (
      <AuthLayout eyebrow="Un paso más" title="Cuenta creada">
        {tipoRegistro === 'personal' ? (
          <>
            <p className="sello-verificado">✔ Tu cuenta ya está activa. Ya puedes iniciar sesión.</p>
            <Button variant="primary" fullWidth onClick={onIrALogin} style={{ marginTop: 'var(--space-3)' }}>Ir a iniciar sesión</Button>
          </>
        ) : (
          <>
            <p className="nota-cientifico">
              ℹ Tu cuenta de emprendimiento quedó registrada como <strong>pendiente de activación</strong>. Te enviamos un enlace de
              activación por correo (en este entorno de desarrollo, revisa el log de la consola del servidor) -- actívala antes de
              iniciar sesión y poder publicar productos.
            </p>
            <Button variant="primary" fullWidth onClick={onIrAActivar} style={{ marginTop: 'var(--space-3)' }}>Activar mi cuenta de empresa</Button>
          </>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Únete a la comunidad"
      title="Crear una cuenta"
      description="Explora el catálogo, participa en consultas o publica productos elaborados con plantas amazónicas."
      footer={
        <>
          <div className="auth-footer-divider">o</div>
          <Button variant="secondary" fullWidth onClick={onIrALogin}>Ya tengo una cuenta</Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <Button variant={tipoRegistro === 'personal' ? 'primary' : 'secondary'} size="sm" onClick={() => setTipoRegistro('personal')}>
          Cuenta personal
        </Button>
        <Button variant={tipoRegistro === 'empresa' ? 'primary' : 'secondary'} size="sm" onClick={() => setTipoRegistro('empresa')}>
          Registrar mi emprendimiento
        </Button>
      </div>
      <p className="comentario-meta" style={{ marginBottom: 'var(--space-3)' }}>
        {tipoRegistro === 'personal'
          ? 'Para explorar el catálogo, hacer consultas y participar en la comunidad. Queda activa de inmediato.'
          : 'Para publicar y vender productos elaborados con plantas amazónicas en el directorio público. Requiere activar la cuenta con un enlace antes de poder publicar.'}
      </p>
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          {tipoRegistro === 'empresa' ? 'Nombre del emprendimiento o responsable' : 'Nombre'}
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </label>
        <label>
          Correo
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={contraseña} onChange={(e) => setContraseña(e.target.value)} required />
        </label>
        <ReglasContrasena contraseña={contraseña} />
        <label>
          Confirmar contraseña
          <input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required />
        </label>
        {error && <p className="error-formulario">{error}</p>}
        <Button type="submit" variant="primary" fullWidth loading={enviando} disabled={!contraseñaEsSegura(contraseña) || contraseña !== confirmacion}>
          {enviando ? 'Creando cuenta…' : tipoRegistro === 'empresa' ? 'Registrar emprendimiento' : 'Registrarme'}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RegistroPage;
