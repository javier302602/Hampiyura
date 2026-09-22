import { ChangeEvent, FormEvent, useState } from 'react';
import { proponerPlanta, type Planta } from '../api/plantas.api';
import { subirMedia, leerArchivoComoBase64 } from '../../m06-publicaciones/api/publicaciones.api';
import Button from '../../../shared/ui/Button';

// Frente 4 (auditoría): no existía ningún flujo de "proponer/publicar planta" en ningún rol --
// solo alta directa por validador/admin (POST /plantas). Este formulario usa el nuevo endpoint
// POST /plantas/proponer (cualquier usuario autenticado), que deja la planta "Pendiente" hasta
// que pase por la bandeja de validación de M-09 -- mismo patrón que Publicar producto/publicación.
// Los campos son exactamente los que ya tiene el catálogo (Planta.props): no se inventan campos
// nuevos. "Usos medicinales/cosméticos/culturales" se documentan aparte, una vez la planta esté
// aprobada y visible, con el flujo ya existente de M-04 ("Proponer un nuevo uso" en la ficha).
function ProponerPlantaForm({ onPropuesta }: { onPropuesta: (creada: Planta) => void }) {
  const [nombreComun, setNombreComun] = useState('');
  const [nombreCientifico, setNombreCientifico] = useState('');
  const [familia, setFamilia] = useState('');
  const [region, setRegion] = useState('');
  const [habitat, setHabitat] = useState('');
  const [imagenPrincipal, setImagenPrincipal] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarSeleccionArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendoFoto(true);
    setError(null);
    try {
      const base64 = await leerArchivoComoBase64(archivo);
      const { url } = await subirMedia(archivo.name, base64);
      setImagenPrincipal(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la fotografía.');
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const creada = await proponerPlanta({
        nombreComun, nombreCientifico, familia, region, habitat,
        imagenPrincipal: imagenPrincipal || undefined,
      });
      onPropuesta(creada);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la propuesta. Revisa los campos obligatorios.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="formulario" style={{ maxWidth: 560 }}>
      <label>
        Nombre común
        <input type="text" value={nombreComun} onChange={(e) => setNombreComun(e.target.value)} placeholder="Ej. Chuchuhuasi" required />
      </label>
      <label>
        Nombre científico
        <input type="text" value={nombreCientifico} onChange={(e) => setNombreCientifico(e.target.value)} placeholder="Ej. Maytenus macrocarpa" required />
      </label>
      <label>
        Familia botánica
        <input type="text" value={familia} onChange={(e) => setFamilia(e.target.value)} placeholder="Ej. Celastraceae" required />
      </label>
      <label>
        Región / área de crecimiento
        <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Ej. Selva central del Perú, 200-800 msnm" required />
      </label>
      <label>
        Hábitat
        <textarea value={habitat} onChange={(e) => setHabitat(e.target.value)} placeholder="Ej. Selva tropical, bosque primario" required />
      </label>
      <label>
        Fotografía (opcional)
        <input type="file" accept="image/*" onChange={manejarSeleccionArchivo} disabled={subiendoFoto} />
      </label>
      {subiendoFoto && <p className="comentario-meta">Subiendo imagen…</p>}
      {imagenPrincipal && <img src={imagenPrincipal} alt="Vista previa" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />}

      <p className="comentario-meta">
        Los usos medicinales, cosméticos o culturales de la planta se documentan aparte, una vez que esta propuesta sea aprobada,
        desde la ficha de la planta ("Proponer un nuevo uso").
      </p>
      <p className="comentario-meta">Tu propuesta quedará "Pendiente" hasta que el equipo la revise; no aparecerá en el catálogo público hasta entonces.</p>

      {error && <p className="error-formulario">{error}</p>}
      <Button type="submit" variant="primary" loading={enviando} disabled={subiendoFoto}>
        {enviando ? 'Enviando…' : 'Proponer planta'}
      </Button>
    </form>
  );
}

export default ProponerPlantaForm;
