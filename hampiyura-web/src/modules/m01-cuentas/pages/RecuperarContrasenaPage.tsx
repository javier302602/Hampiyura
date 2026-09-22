import { FormEvent, useState } from 'react';
import { solicitarRecuperacion } from '../api/cuentas.api';

function RecuperarContrasenaPage({ onIrARestablecer }: { onIrARestablecer: () => void }) {
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await solicitarRecuperacion(correo);
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo solicitar la recuperación.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <section>
        <h2>Recuperar contraseña</h2>
        <p className="comentario-meta">
          Si el correo existe, se generó un token de recuperación (válido 15 minutos). En este entorno de desarrollo
          no se envía un correo real: el token queda registrado en el log del servidor (adapter de consola).
        </p>
        <button onClick={onIrARestablecer}>Ya tengo el token, continuar</button>
      </section>
    );
  }

  return (
    <section>
      <h2>Recuperar contraseña</h2>
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          Correo
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        </label>
        {error && <p className="error-formulario">{error}</p>}
        <button type="submit" disabled={enviando}>{enviando ? 'Enviando…' : 'Solicitar recuperación'}</button>
      </form>
    </section>
  );
}

export default RecuperarContrasenaPage;
