import { FormEvent, useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { listarUsos, registrarUso, type Uso } from '../api/partes-uso.api';
import RequireRole from '../../../shared/auth/RequireRole';
import { esValidador } from '../../../shared/auth/session';
import { Button, Card, EmptyState, ErrorState, LoadingState, SectionHeader } from '../../../shared/ui';

// El catálogo de usos/finalidades (Uso) ya era una tabla real de Prisma con GET/POST /usos --
// lo que faltaba redecorar era esta pantalla (seguía en HTML plano, mismo patrón que PerfilPage
// antes de hoy). El formulario de abajo (visible solo para validadores/admin) es justamente la
// prueba de que es dinámico: cualquier categoría que se registre acá aparece de inmediato en el
// selector "Categoría / propiedad" del buscador (SearchBar), sin tocar código.
function FormularioNuevoUso({ onRegistrado }: { onRegistrado: () => void }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre del uso es obligatorio.'); return; }
    setEnviando(true);
    setError(null);
    try {
      await registrarUso({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined });
      setNombre('');
      setDescripcion('');
      onRegistrado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el uso (¿ya existe ese nombre en el catálogo?).');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <div className="card-ui-body">
        <h3 className="perfil-nombre">Ampliar el catálogo</h3>
        <form onSubmit={manejarSubmit} className="formulario" style={{ maxWidth: 420 }}>
          <label>
            Nombre del uso/finalidad
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Digestivo" required />
          </label>
          <label>
            Descripción (opcional)
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </label>
          {error && <p className="error-formulario">{error}</p>}
          <Button type="submit" variant="primary" loading={enviando}>Ampliar catálogo</Button>
        </form>
      </div>
    </Card>
  );
}

function UsosPage() {
  const [usos, setUsos] = useState<Uso[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function cargar() {
    setError(null);
    listarUsos().then(setUsos).catch(() => setError('No se pudo cargar el catálogo de usos.'));
  }

  useEffect(cargar, []);

  return (
    <section>
      <SectionHeader
        eyebrow="Catálogo · M-04"
        title="Usos y finalidades"
        description="Categorías compartidas que describen para qué se usa cada planta -- alimentan el filtro de búsqueda y el registro de partes de uso."
      />

      {usos === null && !error && <LoadingState cards={3} label="Cargando catálogo de usos" />}
      {error && <ErrorState description={error} />}
      {usos && usos.length === 0 && (
        <EmptyState title="Todavía no hay usos registrados" description="El catálogo está vacío -- un validador o administrador puede agregar el primero." />
      )}
      {usos && usos.length > 0 && (
        <div className="card-grid" style={{ marginBottom: 'var(--space-6)' }}>
          {usos.map((u) => (
            <Card key={u.id}>
              <div className="card-ui-body">
                <span className="plant-card-eyebrow"><Tag size={13} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 4 }} />Uso / finalidad</span>
                <h3 className="plant-card-title">{u.nombre}</h3>
                {u.descripcion && <p className="perfil-correo">{u.descripcion}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <RequireRole permitido={esValidador}>
        <FormularioNuevoUso onRegistrado={cargar} />
      </RequireRole>
    </section>
  );
}

export default UsosPage;
