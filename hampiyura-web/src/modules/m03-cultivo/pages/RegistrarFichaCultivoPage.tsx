import { useState } from 'react';
import RegistrarFichaCultivoForm from '../components/RegistrarFichaCultivoForm';
import RequireRole from '../../../shared/auth/RequireRole';
import { esValidador } from '../../../shared/auth/session';
import type { FichaCultivoCreada } from '../api/fichas-cultivo.api';
import Button from '../../../shared/ui/Button';

// RF-251: la carga de fichas es de Especialista/Administrador (el backend lo exige); un usuario
// común ve el mensaje de acceso denegado de RequireRole, igual que en las bandejas.
function RegistrarFichaCultivoPage({ onVolver, onVerMapa }: { onVolver: () => void; onVerMapa: () => void }) {
  const [registrada, setRegistrada] = useState<{ ficha: FichaCultivoCreada; ubicada: boolean } | null>(null);

  return (
    <section>
      <Button variant="ghost" onClick={onVolver}>← Volver al mapa de cultivo</Button>
      <h2>Registrar ficha de cultivo</h2>
      <RequireRole permitido={esValidador}>
        {registrada ? (
          <>
            <p className="advertencia-no-verificado">
              ⚠ La ficha de cultivo fue registrada como <strong>{registrada.ficha.estadoValidacion}</strong>. No se mostrará como validada
              hasta que un especialista agrónomo o el administrador la apruebe.
              {registrada.ubicada ? ' Su ubicación ya quedó registrada en el mapa.' : ' No se marcó ubicación, así que no aparecerá en el mapa.'}
            </p>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => setRegistrada(null)}>Registrar otra ficha</Button>
              <Button variant="primary" onClick={onVerMapa}>Ver el mapa de cultivo</Button>
            </div>
          </>
        ) : (
          <RegistrarFichaCultivoForm onRegistrada={(ficha, ubicada) => setRegistrada({ ficha, ubicada })} />
        )}
      </RequireRole>
    </section>
  );
}

export default RegistrarFichaCultivoPage;
