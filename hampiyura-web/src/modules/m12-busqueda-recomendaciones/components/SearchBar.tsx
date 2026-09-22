import { useEffect, useState } from 'react';
import { listarUsos, type Uso } from '../../m04-usos-partes/api/partes-uso.api';
import { filtrosVacios, type FiltrosBusqueda } from '../api/busqueda.api';

interface Props {
  onBuscar: (filtros: FiltrosBusqueda) => void;
}

// RF-108 (autocompletado): buscar mientras se escribe, con debounce, en vez de exigir un botón
// "Buscar" -- no hace falta nada nuevo en el backend, el mismo GET /buscar ya combinable sirve.
function SearchBar({ onBuscar }: Props) {
  const [q, setQ] = useState('');
  const [enfermedad, setEnfermedad] = useState('');
  const [categoria, setCategoria] = useState('');
  const [usos, setUsos] = useState<Uso[]>([]);

  useEffect(() => { listarUsos().then(setUsos).catch(() => {}); }, []);

  useEffect(() => {
    const filtros: FiltrosBusqueda = { q, enfermedad, categoria };
    if (filtrosVacios(filtros)) return;
    const timeout = setTimeout(() => onBuscar(filtros), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, enfermedad, categoria]);

  return (
    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center', margin: '1rem 0' }}>
      <input type="text" placeholder="Buscar plantas por nombre…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: '220px' }} />
      <input type="text" placeholder="Enfermedad que trata…" value={enfermedad} onChange={(e) => setEnfermedad(e.target.value)} />
      <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
        <option value="">Categoría / propiedad (todas)</option>
        {usos.map((u) => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
      </select>
    </div>
  );
}

export default SearchBar;
