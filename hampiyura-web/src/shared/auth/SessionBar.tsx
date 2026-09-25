import { FormEvent, useState } from 'react';
import { clearSession, getSession, setSessionToken } from './session';

// Nota: M-01 todavía no tiene una pantalla de login en este frontend (fuera del alcance de
// esta sesión). Este es un mecanismo mínimo para pegar un token JWT ya emitido por la API
// (por ejemplo, vía POST /api/cuentas/login desde curl/Postman) y probar las pantallas
// protegidas por rol. No reemplaza un login real.
function SessionBar() {
  const [session, setSession] = useState(getSession());
  const [token, setToken] = useState('');

  function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    setSession(setSessionToken(token.trim()));
    setToken('');
  }

  function cerrarSesion() { clearSession(); setSession(null); }

  return (
    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '1rem' }}>
      {session ? (
        <>
          <span>Sesión activa — rol: <strong>{session.rol || 'desconocido'}</strong></span>
          <button className="btn btn-secondary btn-sm" onClick={cerrarSesion}>Cerrar sesión</button>
        </>
      ) : (
        <form onSubmit={manejarSubmit} style={{ display: 'flex', gap: '.5rem' }}>
          <input
            type="text"
            placeholder="Pegar token JWT (de /api/cuentas/login)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ minWidth: '320px' }}
          />
          <button className="btn btn-secondary btn-sm" type="submit">Usar token</button>
        </form>
      )}
    </div>
  );
}

export default SessionBar;
