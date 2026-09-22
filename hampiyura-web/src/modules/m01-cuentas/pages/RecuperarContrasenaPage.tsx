import { FormEvent, useState } from 'react';
import { solicitarRecuperacion } from '../api/cuentas.api';
import Button from '../../../shared/ui/Button';
import AuthLayout from '../components/AuthLayout';

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
      <AuthLayout eyebrow="Revisa tu correo" title="Recuperar contraseña">
        <p className="comentario-meta">
          Si el correo existe, se generó un token de recuperación (válido 15 minutos). En este entorno de desarrollo
          no se envía un correo real: el token queda registrado en el log del servidor (adapter de consola).
        </p>
        <Button variant="primary" fullWidth onClick={onIrARestablecer} style={{ marginTop: 'var(--space-3)' }}>Ya tengo el token, continuar</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="¿Olvidaste tu contraseña?" title="Recuperar contraseña" description="Te ayudamos a generar un token para elegir una nueva.">
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          Correo
          <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required autoFocus />
        </label>
        {error && <p className="error-formulario">{error}</p>}
        <Button type="submit" variant="primary" fullWidth loading={enviando}>{enviando ? 'Enviando…' : 'Solicitar recuperación'}</Button>
      </form>
    </AuthLayout>
  );
}

export default RecuperarContrasenaPage;
