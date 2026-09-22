import { FormEvent, useState } from 'react';
import { activarCuenta } from '../api/cuentas.api';

// El token viaja en el enlace que el adapter de correo (de consola, ver resumen) construye como
// /cuentas/activar?token=... -- si alguien abre la SPA con esa query string se prellena aquí,
// pero como no hay envío real de correo en este entorno, lo normal es pegarlo a mano.
function tokenDesdeUrl(): string {
  try { return new URLSearchParams(window.location.search).get('token') ?? ''; } catch { return ''; }
}

function ActivarCuentaPage({ onActivada }: { onActivada: () => void }) {
  const [token, setToken] = useState(tokenDesdeUrl());
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activada, setActivada] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await activarCuenta(token.trim());
      setActivada(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar la cuenta.');
    } finally {
      setEnviando(false);
    }
  }

  if (activada) {
    return (
      <section>
        <h2>Cuenta activada</h2>
        <p className="sello-verificado">✔ Tu cuenta fue activada correctamente. Ya puedes iniciar sesión.</p>
        <button onClick={onActivada}>Ir a iniciar sesión</button>
      </section>
    );
  }

  return (
    <section>
      <h2>Activar cuenta</h2>
      <p className="comentario-meta">
        En este entorno de desarrollo no hay envío real de correo: el token de activación se genera al registrarse y
        queda registrado en el log del servidor (adapter de consola), con una línea del tipo
        "[email:activacion] Para &lt;correo&gt; -&gt; enlace: /cuentas/activar?token=&lt;token&gt;".
      </p>
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          Token de activación
          <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required />
        </label>
        {error && <p className="error-formulario">{error}</p>}
        <button type="submit" disabled={enviando || !token.trim()}>{enviando ? 'Activando…' : 'Activar cuenta'}</button>
      </form>
    </section>
  );
}

export default ActivarCuentaPage;
