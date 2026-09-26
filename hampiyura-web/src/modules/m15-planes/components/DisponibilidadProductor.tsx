import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerMiDisponibilidad, marcarMiDisponibilidad, RUTAS_EXTRAS, type MiDisponibilidad } from '../api/extras.api';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';

// Para cuentas de Productor: marcarse "disponible para contacto ahora". Aparece en "Productores disponibles" (complemento Premium de quienes
// compran). La marca vence sola a los 7 días si no se renueva. Solo se puede con una ficha de cultivo validada (misma condición del directorio).
function DisponibilidadProductor() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<MiDisponibilidad | null>(null);
  const [nota, setNota] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const cargar = () => obtenerMiDisponibilidad().then((e) => { setEstado(e); setNota(e.nota ?? ''); }).catch(() => setEstado(null));
  useEffect(() => { cargar(); }, []);
  if (!estado) return null;

  async function cambiar(disponible: boolean) {
    setTrabajando(true); setError(null);
    try { await marcarMiDisponibilidad(disponible, nota.trim() || undefined); await cargar(); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar tu disponibilidad.'); }
    finally { setTrabajando(false); }
  }

  return (
    <div className="disponibilidad-productor">
      <h3 className="perfil-nombre">Disponible para contacto ahora</h3>
      <p className="perfil-correo">Si marcas que estás disponible, apareces en “Productores disponibles” para quienes tienen un plan Empresarial o Institucional, o el plan Negocio con el complemento Premium. Nunca se muestra tu ubicación exacta ni tu teléfono. La marca vence sola a los 7 días.</p>
      <p>{estado.disponible ? <Badge variant="success">Disponible hasta el {new Date(estado.disponibleHasta!).toLocaleDateString('es-PE')}</Badge> : <Badge variant="neutral">No estás marcado como disponible</Badge>}</p>
      {!estado.contactable && <p className="comentario-meta">Para aparecer necesitas una ficha de cultivo validada por un especialista (la misma condición del directorio de productores).</p>}
      <label>Nota breve (opcional)
        <input type="text" maxLength={200} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. Tengo cosecha de uña de gato esta semana" />
      </label>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: '.5rem' }}>
        <Button variant="primary" disabled={trabajando || !estado.contactable} onClick={() => cambiar(true)}>{estado.disponible ? 'Renovar por 7 días' : 'Marcarme disponible'}</Button>
        {estado.disponible && <Button variant="secondary" disabled={trabajando} onClick={() => cambiar(false)}>Quitar mi disponibilidad</Button>}
        <Button variant="ghost" onClick={() => navigate(RUTAS_EXTRAS.mensajes)}>Ver mis mensajes</Button>
      </div>
      {error && <p className="error-formulario" role="alert">{error}</p>}
    </div>
  );
}

export default DisponibilidadProductor;
