import { FormEvent, useState } from 'react';
import { registrar } from '../api/cuentas.api';
import ReglasContrasena, { contraseñaEsSegura } from '../components/ReglasContrasena';

function RegistroPage({ onIrALogin }: { onIrALogin: () => void }) {
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
      await registrar({ nombre, correo, contraseña, contraseñaConfirmacion: confirmacion });
      setRegistrado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    } finally {
      setEnviando(false);
    }
  }

  if (registrado) {
    return (
      <section>
        <h2>Cuenta creada</h2>
        <p className="sello-verificado">✔ Tu cuenta ya está activa. Ya puedes iniciar sesión.</p>
        <button onClick={onIrALogin}>Ir a iniciar sesión</button>
      </section>
    );
  }

  return (
    <section>
      <h2>Crear una cuenta</h2>
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          Nombre
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
        <button type="submit" disabled={enviando || !contraseñaEsSegura(contraseña) || contraseña !== confirmacion}>
          {enviando ? 'Creando cuenta…' : 'Registrarme'}
        </button>
      </form>
      <button onClick={onIrALogin}>Ya tengo una cuenta</button>
    </section>
  );
}

export default RegistroPage;
