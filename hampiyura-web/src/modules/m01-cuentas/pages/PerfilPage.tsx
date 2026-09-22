import { FormEvent, useEffect, useState } from 'react';
import { obtenerPerfil, cambiarContrasena, type Perfil } from '../api/cuentas.api';
import ReglasContrasena, { contraseñaEsSegura } from '../components/ReglasContrasena';

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
      <button type="submit" disabled={enviando || !contraseñaEsSegura(contraseñaNueva) || contraseñaNueva !== confirmacion}>
        {enviando ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}

function PerfilPage({ onVolver }: { onVolver: () => void }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerPerfil().then(setPerfil).catch(() => setError('No se pudo cargar tu perfil.')).finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando perfil…</p>;
  if (error) return <p>{error}</p>;
  if (!perfil) return <p>No se encontró tu perfil.</p>;

  return (
    <section>
      <button onClick={onVolver}>← Volver al catálogo</button>
      <h2>Mi perfil</h2>
      <p><strong>{perfil.nombre}</strong></p>
      <p>Correo: {perfil.correo}</p>
      <p>Rol: {perfil.rol}</p>
      <p>Estado de la cuenta: {perfil.estado}</p>
      <p>Región: {perfil.region} · Idioma: {perfil.idioma} · Nivel de conocimiento: {perfil.nivelConocimiento}</p>

      <h3>Cambiar contraseña</h3>
      <FormularioCambiarContrasena />
    </section>
  );
}

export default PerfilPage;
