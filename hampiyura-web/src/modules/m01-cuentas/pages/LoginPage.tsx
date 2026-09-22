import { FormEvent, useState } from 'react';
import { login } from '../api/cuentas.api';
import { setSessionToken } from '../../../shared/auth/session';

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
        <button type="submit" disabled={enviando}>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</button>
      </form>
      <p>
        <button onClick={onIrARecuperar}>Olvidé mi contraseña</button>
        {' · '}
        <button onClick={onIrARegistro}>Crear una cuenta</button>
        {' · '}
        <button onClick={onIrAActivar}>Activar mi cuenta</button>
      </p>
    </section>
  );
}

export default LoginPage;
