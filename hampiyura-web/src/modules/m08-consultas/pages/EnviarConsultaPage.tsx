import { FormEvent, useState } from 'react';
import { crearConsulta, TIPOS_CONSULTA, ETIQUETAS_TIPO_CONSULTA, type TipoConsulta, type Consulta } from '../api/consultas.api';
import { getSession } from '../../../shared/auth/session';

interface Props {
  onVerMisConsultas: () => void;
  onVolver: () => void;
}

// RF-263/265: accesible sin sesión -- el backend ya soporta el envío como visitante
// (attachUserIfPresent adjunta autorId solo si hay sesión).
function EnviarConsultaPage({ onVerMisConsultas, onVolver }: Props) {
  const [tipo, setTipo] = useState<TipoConsulta>('PreguntaGeneral');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState<Consulta | null>(null);
  const haySesion = !!getSession();

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const creada = await crearConsulta({ tipo, descripcion });
      setEnviada(creada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la consulta.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviada) {
    return (
      <section>
        <button onClick={onVolver}>← Volver al catálogo</button>
        <h2>Consulta enviada</h2>
        <p className="sello-verificado">✔ Tu consulta ("{ETIQUETAS_TIPO_CONSULTA[enviada.tipo]}") fue recibida{enviada.prioridad === 'Alta' && ' con prioridad alta'}.</p>
        {haySesion ? (
          <>
            <p>Puedes seguir el estado de esta consulta y del resto de las tuyas en cualquier momento.</p>
            <button onClick={onVerMisConsultas}>Ver mis consultas</button>
          </>
        ) : (
          <p className="advertencia-no-verificado">
            ⚠ Enviaste esta consulta sin una cuenta. El sistema no guarda a qué visitante pertenece, así que
            <strong> no vas a poder ver su estado ni su respuesta después</strong> -- si quieres darle seguimiento,
            crea una cuenta antes de enviar tu próxima consulta.
          </p>
        )}
      </section>
    );
  }

  return (
    <section>
      <button onClick={onVolver}>← Volver al catálogo</button>
      <h2>Contacto / Ayuda</h2>
      <p>Envíanos una consulta, reporte o solicitud. {!haySesion && 'Puedes hacerlo sin crear una cuenta.'}</p>
      <form onSubmit={manejarSubmit} className="formulario">
        <label>
          Tipo de consulta
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoConsulta)}>
            {TIPOS_CONSULTA.map((t) => <option key={t} value={t}>{ETIQUETAS_TIPO_CONSULTA[t]}</option>)}
          </select>
        </label>
        <label>
          Descripción
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
        </label>
        {!haySesion && (
          <p className="comentario-meta">
            No tienes una sesión activa: esta consulta se enviará como visitante y no vas a poder consultar su
            estado después (no hay forma de asociarla contigo sin una cuenta).
          </p>
        )}
        {error && <p className="error-formulario">{error}</p>}
        <button type="submit" disabled={enviando || !descripcion.trim()}>{enviando ? 'Enviando…' : 'Enviar consulta'}</button>
      </form>
    </section>
  );
}

export default EnviarConsultaPage;
