import { useState } from 'react';
import Button from '../../../shared/ui/Button';
import PublicarProductoForm from '../components/PublicarProductoForm';
import RequireRole from '../../../shared/auth/RequireRole';
import { esProductor } from '../../../shared/auth/session';
import type { Producto } from '../api/productos.api';

// No existe (todavía) un flujo de autoservicio para que un usuario se vuelva Productor -- el rol
// solo se asigna manualmente (no hay endpoint de cambio de rol en el backend, ver Plan de Gestión
// de Cambios). Esta pantalla asume que la cuenta ya tiene ese rol asignado de antemano.
function PublicarProductoPage({ onVolver }: { onVolver: () => void }) {
  const [publicado, setPublicado] = useState<Producto | null>(null);

  return (
    <section>
      <Button variant="ghost" onClick={onVolver}>← Volver al catálogo</Button>
      <h2>Publicar producto (M-11)</h2>
      <RequireRole permitido={esProductor}>
        {publicado ? (
          <>
            <p className="advertencia-no-verificado">
              ⚠ "{publicado.nombre}" fue publicado como <strong>{publicado.estadoValidacion}</strong>. No aparecerá en el directorio público hasta que el equipo lo revise y apruebe.
            </p>
            <button onClick={() => setPublicado(null)}>Publicar otro producto</button>
          </>
        ) : (
          <PublicarProductoForm onPublicado={setPublicado} />
        )}
      </RequireRole>
    </section>
  );
}

export default PublicarProductoPage;
