import { FormEvent, useState } from 'react';
import { actualizarGuiaCultivo, type GuiaCultivo as Guia } from '../api/fichas-cultivo.api';
import { getSession } from '../../../shared/auth/session';
import Button from '../../../shared/ui/Button';

const PENDIENTE = 'Pendiente de un especialista en agronomía';

// Mismos apartados y claves que el servidor (guia-cultivo.vo.ts). "corto" = un valor (rango, época); "largo" = texto explicativo.
interface Campo { clave: string; etiqueta: string; tipo: 'corto' | 'largo'; ayuda?: string }
const SECCIONES: { titulo: string; campos: Campo[] }[] = [
  { titulo: 'Suelo', campos: [
    { clave: 'suelo', etiqueta: 'Tipo o textura', tipo: 'largo' },
    { clave: 'ph', etiqueta: 'Rango de pH ideal', tipo: 'corto', ayuda: 'Ej. 5,5 a 6,5' },
    { clave: 'drenaje', etiqueta: 'Drenaje', tipo: 'largo' } ] },
  { titulo: 'Nutrientes', campos: [
    { clave: 'nutrientes', etiqueta: 'Requerimientos principales (N-P-K u otros)', tipo: 'largo' },
    { clave: 'enmiendas', etiqueta: 'Enmiendas orgánicas recomendadas', tipo: 'largo' } ] },
  { titulo: 'Calendario', campos: [
    { clave: 'epocaSiembra', etiqueta: 'Época de siembra', tipo: 'corto' },
    { clave: 'cicloCosecha', etiqueta: 'Duración del ciclo hasta la cosecha', tipo: 'corto' },
    { clave: 'germinacion', etiqueta: 'Tiempo estimado de germinación', tipo: 'corto' } ] },
  { titulo: 'Espaciamiento', campos: [{ clave: 'espaciamiento', etiqueta: 'Distancia entre plantas o densidad de siembra', tipo: 'corto' }] },
  { titulo: 'Riego', campos: [{ clave: 'riego', etiqueta: 'Método y frecuencia aproximada', tipo: 'largo' }] },
  { titulo: 'Clima', campos: [
    { clave: 'temperatura', etiqueta: 'Rango de temperatura', tipo: 'corto' },
    { clave: 'altitud', etiqueta: 'Altitud adecuada', tipo: 'corto' },
    { clave: 'precipitacion', etiqueta: 'Precipitación adecuada', tipo: 'corto' } ] },
  { titulo: 'Plagas y enfermedades', campos: [{ clave: 'plagas', etiqueta: 'Problemas comunes y manejo responsable', tipo: 'largo', ayuda: 'Manejo cultural, biológico u orgánico. No se aceptan agroquímicos peligrosos.' }] },
  { titulo: 'Herramientas', campos: [{ clave: 'herramientas', etiqueta: 'Herramientas necesarias', tipo: 'largo' }] },
  { titulo: 'Cosecha', campos: [{ clave: 'indicadoresCosecha', etiqueta: 'Señales de que está lista para cosechar', tipo: 'largo' }] },
];

// Guía de cultivo de una ficha: panel con secciones (suelo, nutrientes, calendario, espaciamiento, riego, clima, plagas, herramientas,
// cosecha). La ve cualquiera; solo la escribe un Especialista en agronomía (o un Administrador). Nunca se rellena por el sistema:
// vacío = pendiente de un especialista.
function GuiaCultivo({ cultivoId, guia, onGuardada }: { cultivoId: string; guia: Guia; onGuardada: (g: Guia) => void }) {
  const sesion = getSession();
  const puedeEditar = !!sesion && (sesion.rol === 'EspecialistaAgronomo' || sesion.rol === 'Administrador');
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrirEditor() {
    const inicial: Record<string, string> = {};
    for (const s of SECCIONES) for (const c of s.campos) inicial[c.clave] = guia.campos[c.clave] ?? '';
    setValores(inicial); setError(null); setEditando(true);
  }
  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true); setError(null);
    try { onGuardada(await actualizarGuiaCultivo(cultivoId, valores)); setEditando(false); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar la guía.'); }
    finally { setGuardando(false); }
  }

  const vacia = guia.completada === 0;
  return (
    <details className="guia-cultivo" open={!vacia || undefined}>
      <summary>
        <span className="guia-titulo">Guía para cultivarla</span>
        <span className="guia-progreso">{guia.completada} de {guia.total} apartados completos</span>
      </summary>

      {!editando && (
        <>
          {SECCIONES.map((s) => (
            <section key={s.titulo} className="guia-seccion" aria-label={s.titulo}>
              <h5>{s.titulo}</h5>
              <dl>
                {s.campos.map((c) => {
                  const valor = guia.campos[c.clave];
                  return (
                    <div key={c.clave} className="guia-item">
                      <dt>{c.etiqueta}</dt>
                      <dd className={valor ? undefined : 'guia-pendiente'}>{valor ?? PENDIENTE}</dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
          {vacia
            ? <p className="comentario-meta">Todavía no hay una guía: la redacta un especialista en agronomía. No se muestra información genérica mientras tanto.</p>
            : <p className="comentario-meta">Guía redactada por un especialista en agronomía{guia.actualizadaEn ? ` · ${new Date(guia.actualizadaEn).toLocaleDateString('es-PE')}` : ''}.</p>}
          {puedeEditar && <Button size="sm" variant="secondary" onClick={abrirEditor}>{vacia ? 'Redactar guía' : 'Editar guía'}</Button>}
        </>
      )}

      {editando && (
        <form onSubmit={guardar} className="formulario" style={{ maxWidth: 'none', padding: 0, border: 'none', background: 'none', boxShadow: 'none', marginTop: 0 }}>
          {SECCIONES.map((s) => (
            <fieldset key={s.titulo} className="guia-fieldset">
              <legend>{s.titulo}</legend>
              {s.campos.map((c) => (
                <label key={c.clave}>
                  {c.etiqueta}
                  {c.tipo === 'corto'
                    ? <input type="text" value={valores[c.clave] ?? ''} maxLength={1500} placeholder={c.ayuda} onChange={(e) => setValores((v) => ({ ...v, [c.clave]: e.target.value }))} />
                    : <textarea value={valores[c.clave] ?? ''} maxLength={1500} placeholder={c.ayuda} onChange={(e) => setValores((v) => ({ ...v, [c.clave]: e.target.value }))} />}
                </label>
              ))}
            </fieldset>
          ))}
          <p className="comentario-meta">Deja vacío lo que no puedas respaldar: quedará como “pendiente”. Lo que escribas lo verá cualquier persona que consulte esta ficha.</p>
          {error && <p className="error-formulario" role="alert">{error}</p>}
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <Button type="submit" variant="primary" loading={guardando}>{guardando ? 'Guardando…' : 'Guardar guía'}</Button>
            <Button type="button" variant="ghost" onClick={() => setEditando(false)}>Cancelar</Button>
          </div>
        </form>
      )}
    </details>
  );
}

export default GuiaCultivo;
