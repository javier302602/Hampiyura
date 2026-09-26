import { FormEvent, useState } from 'react';
import { actualizarGuiaCultivo, type GuiaCultivo as Guia } from '../api/fichas-cultivo.api';
import { getSession } from '../../../shared/auth/session';
import Button from '../../../shared/ui/Button';

const PENDIENTE = 'Pendiente de un especialista en agronomía';

// Guía de cultivo de una ficha: tipo/medición de suelo, nutrientes y herramientas. La ve cualquiera; solo la escribe un
// Especialista en agronomía (o un Administrador). Nunca se rellena por el sistema: vacío = pendiente de un especialista.
function GuiaCultivo({ cultivoId, guia, onGuardada }: { cultivoId: string; guia: Guia; onGuardada: (g: Guia) => void }) {
  const sesion = getSession();
  const puedeEditar = !!sesion && (sesion.rol === 'EspecialistaAgronomo' || sesion.rol === 'Administrador');
  const [editando, setEditando] = useState(false);
  const [suelo, setSuelo] = useState(guia.suelo ?? '');
  const [nutrientes, setNutrientes] = useState(guia.nutrientes ?? '');
  const [herramientas, setHerramientas] = useState(guia.herramientas ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true); setError(null);
    try { onGuardada(await actualizarGuiaCultivo(cultivoId, { suelo, nutrientes, herramientas })); setEditando(false); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar la guía.'); }
    finally { setGuardando(false); }
  }

  const vacia = !guia.suelo && !guia.nutrientes && !guia.herramientas;
  const item = (etiqueta: string, valor: string | null) => (
    <div className="guia-item">
      <dt>{etiqueta}</dt>
      <dd className={valor ? undefined : 'guia-pendiente'}>{valor ?? PENDIENTE}</dd>
    </div>
  );

  return (
    <div className="guia-cultivo" role="group" aria-label="Guía de cultivo">
      <h4>Guía para cultivarla</h4>
      {!editando && (
        <>
          <dl>
            {item('Suelo o tierra (tipo y medición)', guia.suelo)}
            {item('Nutrientes necesarios', guia.nutrientes)}
            {item('Herramientas necesarias', guia.herramientas)}
          </dl>
          {vacia
            ? <p className="comentario-meta">Todavía no hay una guía: la redacta un especialista en agronomía. No se muestra información genérica mientras tanto.</p>
            : <p className="comentario-meta">Guía redactada por un especialista en agronomía{guia.actualizadaEn ? ` · ${new Date(guia.actualizadaEn).toLocaleDateString('es-PE')}` : ''}.</p>}
          {puedeEditar && <Button size="sm" variant="secondary" onClick={() => setEditando(true)}>{vacia ? 'Redactar guía' : 'Editar guía'}</Button>}
        </>
      )}
      {editando && (
        <form onSubmit={guardar} className="formulario" style={{ maxWidth: 'none', padding: 0, border: 'none', background: 'none', boxShadow: 'none', marginTop: 0 }}>
          <label>
            Suelo o tierra (tipo y medición)
            <textarea value={suelo} onChange={(e) => setSuelo(e.target.value)} maxLength={1500} placeholder="Ej. textura, drenaje y pH recomendado, según tu experiencia o fuente." />
          </label>
          <label>
            Nutrientes necesarios
            <textarea value={nutrientes} onChange={(e) => setNutrientes(e.target.value)} maxLength={1500} />
          </label>
          <label>
            Herramientas necesarias
            <textarea value={herramientas} onChange={(e) => setHerramientas(e.target.value)} maxLength={1500} />
          </label>
          <p className="comentario-meta">Deja vacío lo que no puedas respaldar: quedará como “pendiente”. Lo que escribas lo verá cualquier persona que consulte esta ficha.</p>
          {error && <p className="error-formulario" role="alert">{error}</p>}
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <Button type="submit" variant="primary" loading={guardando}>{guardando ? 'Guardando…' : 'Guardar guía'}</Button>
            <Button type="button" variant="ghost" onClick={() => setEditando(false)}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default GuiaCultivo;
