import { FormEvent, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { login } from '../api/cuentas.api';
import { hayAvisoDeSesionExpirada, setSessionToken } from '../../../shared/auth/session';
import Button from '../../../shared/ui/Button';
import AuthLayout from '../components/AuthLayout';

interface Props {
  onIngreso: () => void;
  onIrARegistro: () => void;
  onIrARecuperar: () => void;
  onIrAActivar: () => void;
}

function LoginPage({ onIngreso, onIrARegistro, onIrARecuperar, onIrAActivar }: Props) {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sesionExpirada] = useState(hayAvisoDeSesionExpirada());

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const resultado = await login(correo, contraseña);
      // Mismo mecanismo que SessionBar (setSessionToken): dispara el evento hampiyura:session-changed
      // que ya escucha RequireRole, así el resto de la app reacciona igual sin importar cómo se inició sesión.
      setSessionToken(resultado.token);
      onIngreso();
    } catch (err) {
      // El backend ya diferencia "Credenciales inválidas" / "La cuenta no ha sido activada..." /
      // "La cuenta está suspendida" -- apiRequest ahora propaga ese mensaje real, se muestra tal cual.
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Bienvenido de vuelta"
      title="Iniciar sesión"
      description="Accede para hacer consultas, proponer plantas o publicar productos con tu cuenta."
      footer={
        <>
          <button type="button" className="auth-link-recuperar" onClick={onIrARecuperar}>
            <KeyRound size={14} aria-hidden="true" /> ¿Olvidaste tu contraseña?
          </button>
          <div className="auth-footer-divider">o</div>
          <Button variant="secondary" fullWidth onClick={onIrARegistro}>Crear una cuenta</Button>
          {/* Separado y de menor jerarquía a propósito -- no aplica a cuentas personales (CG-005:
              quedan activas de inmediato), solo a cuentas de empresa/emprendimiento (rol Productor). */}
          <p className="auth-footer-note">
            ¿Registraste una empresa o emprendimiento? <button className="btn btn-ghost btn-sm" style={{ padding: 0 }} onClick={onIrAActivar}>Activa tu cuenta aquí</button>
          </p>
        </>
      }
    >
      {sesionExpirada && (
        <p className="nota-cientifico" role="status" style={{ marginBottom: 'var(--space-3)' }}>
          Tu sesión expiró (por seguridad dura un día). Inicia sesión de nuevo para continuar.
        </p>
      )}
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          Correo
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoFocus />
        </label>
        <label>
          Contraseña
          <input type="password" value={contraseña} onChange={(e) => setContraseña(e.target.value)} required />
        </label>
        {error && <p className="error-formulario">{error}</p>}
        <Button type="submit" variant="primary" fullWidth loading={enviando}>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</Button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
