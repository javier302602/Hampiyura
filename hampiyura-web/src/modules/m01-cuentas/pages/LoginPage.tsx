import { FormEvent, useState } from 'react';
import { login } from '../api/cuentas.api';
import { setSessionToken } from '../../../shared/auth/session';
import Button from '../../../shared/ui/Button';

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
    <section>
      <h2>Iniciar sesión</h2>
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          Correo
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={contraseña} onChange={(e) => setContraseña(e.target.value)} required />
        </label>
        {error && <p className="error-formulario">{error}</p>}
        <Button type="submit" variant="primary" loading={enviando}>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</Button>
      </form>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
        <Button variant="ghost" onClick={onIrARecuperar}>Olvidé mi contraseña</Button>
        <Button variant="ghost" onClick={onIrARegistro}>Crear una cuenta</Button>
      </div>
      {/* Separado y de menor jerarquía a propósito -- no aplica a cuentas personales (CG-005: quedan
          activas de inmediato), solo a cuentas de empresa/emprendimiento (rol Productor). */}
      <p className="comentario-meta" style={{ marginTop: 'var(--space-4)' }}>
        ¿Registraste una empresa o emprendimiento? <button className="btn btn-ghost btn-sm" style={{ padding: 0 }} onClick={onIrAActivar}>Activa tu cuenta aquí</button>
      </p>
    </section>
  );
}

export default LoginPage;
