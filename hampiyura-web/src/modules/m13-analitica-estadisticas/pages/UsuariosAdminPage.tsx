import { useEffect, useState } from 'react';
import { cambiarRolUsuario, listarUsuarios, reactivarUsuario, suspenderUsuario, ROLES_USUARIO, type UsuarioAdmin } from '../api/admin.api';
import LoadingState from '../../../shared/ui/LoadingState';
import ErrorState from '../../../shared/ui/ErrorState';
import Badge from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';

const ETIQUETA_ESTADO: Record<UsuarioAdmin['estado'], { texto: string; variante: 'success' | 'warning' | 'danger' }> = {
  Activo: { texto: 'Activo', variante: 'success' },
  PendienteActivacion: { texto: 'Pendiente de activación', variante: 'warning' },
  Suspendido: { texto: 'Suspendido', variante: 'danger' },
};

// Antes de esta pantalla, listar/suspender/reactivar usuarios existían en el backend sin ningún
// consumidor -- el único cambio de rol era editar la base de datos a mano (así se probó todo el
// resto de esta sesión). requireAdmin ya protege las 4 rutas en el servidor; esta página también
// está gateada a Administrador en App.tsx (RequireRole), doble candado intencional.
function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState<string | null>(null);

  function cargar() {
    setError(null);
    listarUsuarios().then(setUsuarios).catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de usuarios.'));
  }
  useEffect(cargar, []);

  async function manejarCambioRol(u: UsuarioAdmin, nuevoRol: UsuarioAdmin['rol']) {
    if (nuevoRol === u.rol) return;
    if (nuevoRol === 'Administrador' && !window.confirm(`¿Convertir a "${u.nombre}" en Administrador? Va a tener acceso total al panel de administración.`)) return;
    setAccionError(null);
    setProcesando(u.id);
    try {
      await cambiarRolUsuario(u.id, nuevoRol);
      cargar();
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo cambiar el rol.');
    } finally {
      setProcesando(null);
    }
  }

  async function manejarEstado(u: UsuarioAdmin) {
    setAccionError(null);
    setProcesando(u.id);
    try {
      if (u.estado === 'Suspendido') await reactivarUsuario(u.id);
      else await suspenderUsuario(u.id);
      cargar();
    } catch (err) {
      setAccionError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setProcesando(null);
    }
  }

  return (
    <section className="gestion-panel">
      <h2>Usuarios (M-13)</h2>
      <p className="comentario-meta">
        Cambiar el rol o suspender/reactivar una cuenta tiene efecto inmediato. Solo un Administrador puede llegar a esta pantalla,
        así que solo un Administrador puede asignar el rol Administrador a otra cuenta.
      </p>
      {accionError && <p className="error-formulario">{accionError}</p>}

      {usuarios === null && !error && <LoadingState label="Cargando usuarios…" />}
      {error && <ErrorState description={error} />}

      {usuarios && (
        <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          {usuarios.map((u) => {
            const estado = ETIQUETA_ESTADO[u.estado];
            return (
              <div key={u.id} className="card-ui card-ui-body" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px', display: 'grid', gap: '2px' }}>
                  <strong>{u.nombre}</strong>
                  <span className="comentario-meta">{u.correo}</span>
                </div>
                <Badge variant={estado.variante}>{estado.texto}</Badge>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 700, fontSize: 'var(--font-size-small)' }}>
                  Rol
                  <select value={u.rol} disabled={procesando === u.id} onChange={(e) => manejarCambioRol(u, e.target.value as UsuarioAdmin['rol'])}>
                    {ROLES_USUARIO.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <Button
                  variant={u.estado === 'Suspendido' ? 'secondary' : 'danger'}
                  size="sm"
                  disabled={procesando === u.id}
                  onClick={() => manejarEstado(u)}
                >
                  {u.estado === 'Suspendido' ? 'Reactivar' : 'Suspender'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default UsuariosAdminPage;
