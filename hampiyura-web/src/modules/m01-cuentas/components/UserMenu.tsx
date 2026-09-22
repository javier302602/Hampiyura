import { useEffect, useState } from 'react';
import { obtenerPerfil, type Perfil } from '../api/cuentas.api';
import { getSession, clearSession, suscribirseACambiosDeSesion } from '../../../shared/auth/session';

interface Props {
  onIrALogin: () => void;
  onIrARegistro: () => void;
  onIrAPerfil: () => void;
  onIrAMisConsultas: () => void;
}

// Reemplaza a SessionBar como forma PRINCIPAL de entrar/ver la sesión -- SessionBar se mantiene
// disponible aparte (colapsada, modo desarrollo) para pruebas rápidas con un token pegado a mano.
function UserMenu({ onIrALogin, onIrARegistro, onIrAPerfil, onIrAMisConsultas }: Props) {
  const [sesion, setSesion] = useState(getSession());
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  function cargarPerfil() {
    if (!getSession()) { setPerfil(null); return; }
    obtenerPerfil().then(setPerfil).catch(() => setPerfil(null));
  }

  useEffect(() => suscribirseACambiosDeSesion(() => { setSesion(getSession()); cargarPerfil(); }), []);
  useEffect(cargarPerfil, []);

  if (!sesion) {
    return (
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <button className="accion-secundaria" onClick={onIrALogin}>Iniciar sesión</button>
        <button className="accion-principal" onClick={onIrARegistro}>Registrarse</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
      <span>Hola, <strong>{perfil?.nombre ?? '…'}</strong> ({sesion.rol || 'rol desconocido'})</span>
      <button onClick={onIrAPerfil}>Mi perfil</button>
      <button onClick={onIrAMisConsultas}>Mis consultas</button>
      <button onClick={clearSession}>Cerrar sesión</button>
    </div>
  );
}

export default UserMenu;
