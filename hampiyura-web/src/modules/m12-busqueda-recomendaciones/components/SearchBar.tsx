import { useEffect, useId, useState } from 'react';
import { Search } from 'lucide-react';
import { listarUsos, type Uso } from '../../m04-usos-partes/api/partes-uso.api';
import { filtrosVacios, type FiltrosBusqueda } from '../api/busqueda.api';

interface Props {
  onBuscar: (filtros: FiltrosBusqueda) => void;
  /** 'brand' (default): sobre la franja oscura del Header. 'surface': dentro del drawer móvil
      (fondo claro/superficie) -- mismo componente y lógica, distinto set de clases de color. */
  tono?: 'brand' | 'surface';
}

// RF-108 (autocompletado): buscar mientras se escribe, con debounce, en vez de exigir un botón
// "Buscar" -- no hace falta nada nuevo en el backend, el mismo GET /buscar ya combinable sirve.
// Lógica sin cambios respecto a la versión anterior; lo que cambia es que ahora vive en el Header
// (compacta, sobre la franja de marca) y cada campo tiene una etiqueta real asociada -- antes
// dependía solo del placeholder, que no es un sustituto válido de <label> (ver auditoría).
function SearchBar({ onBuscar, tono = 'brand' }: Props) {
  const [q, setQ] = useState('');
  const [enfermedad, setEnfermedad] = useState('');
  const [categoria, setCategoria] = useState('');
  const [usos, setUsos] = useState<Uso[]>([]);
  const idBase = useId();

  useEffect(() => { listarUsos().then(setUsos).catch(() => {}); }, []);

  useEffect(() => {
    const filtros: FiltrosBusqueda = { q, enfermedad, categoria };
    if (filtrosVacios(filtros)) return;
    const timeout = setTimeout(() => onBuscar(filtros), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, enfermedad, categoria]);

  return (
    <div className={`site-header-search-group${tono === 'surface' ? ' site-header-search-group-surface' : ''}`}>
      <div className="site-header-search">
        <Search size={15} aria-hidden="true" className="site-header-search-icon" />
        <label htmlFor={`${idBase}-q`} className="sr-only">Buscar plantas por nombre</label>
        <input id={`${idBase}-q`} type="search" placeholder="Buscar plantas…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <label htmlFor={`${idBase}-enfermedad`} className="sr-only">Enfermedad que trata</label>
      <input id={`${idBase}-enfermedad`} type="search" placeholder="Enfermedad que trata…" value={enfermedad} onChange={(e) => setEnfermedad(e.target.value)} />
      <label htmlFor={`${idBase}-categoria`} className="sr-only">Categoría o propiedad</label>
      <select id={`${idBase}-categoria`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
        <option value="">Categoría / propiedad (todas)</option>
        {usos.map((u) => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
      </select>
    </div>
  );
}

export default SearchBar;
