import { FormEvent, useState } from 'react';
import { restablecerContrasena } from '../api/cuentas.api';
import ReglasContrasena, { contraseñaEsSegura } from '../components/ReglasContrasena';
import Button from '../../../shared/ui/Button';
import AuthLayout from '../components/AuthLayout';

function tokenDesdeUrl(): string {
  try { return new URLSearchParams(window.location.search).get('token') ?? ''; } catch { return ''; }
}

function RestablecerContrasenaPage({ onRestablecida }: { onRestablecida: () => void }) {
  const [token, setToken] = useState(tokenDesdeUrl());
  const [contraseñaNueva, setContraseñaNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restablecida, setRestablecida] = useState(false);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contraseñaEsSegura(contraseñaNueva)) { setError('La contraseña todavía no cumple los requisitos de seguridad.'); return; }
    if (contraseñaNueva !== confirmacion) { setError('La confirmación no coincide.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await restablecerContrasena(token.trim(), contraseñaNueva, confirmacion);
      setRestablecida(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  if (restablecida) {
    return (
      <AuthLayout eyebrow="Listo" title="Contraseña restablecida">
        <p className="sello-verificado">✔ Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión con ella.</p>
        <Button variant="primary" fullWidth onClick={onRestablecida} style={{ marginTop: 'var(--space-3)' }}>Ir a iniciar sesión</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Último paso" title="Restablecer contraseña" description="Pega el token de recuperación (leído del log del servidor en desarrollo -- válido solo 15 minutos).">
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          Token de recuperación
          <input type="text" value={token} onChange={(e) => setToken(e.target.value)} required autoFocus />
        </label>
        <label>
          Nueva contraseña
          <input type="password" value={contraseñaNueva} onChange={(e) => setContraseñaNueva(e.target.value)} required />
        </label>
        <ReglasContrasena contraseña={contraseñaNueva} />
        <label>
          Confirmar nueva contraseña
          <input type="password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} required />
        </label>
        {error && <p className="error-formulario">{error}</p>}
        <Button type="submit" variant="primary" fullWidth loading={enviando} disabled={!contraseñaEsSegura(contraseñaNueva) || contraseñaNueva !== confirmacion}>
          {enviando ? 'Restableciendo…' : 'Restablecer contraseña'}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RestablecerContrasenaPage;
