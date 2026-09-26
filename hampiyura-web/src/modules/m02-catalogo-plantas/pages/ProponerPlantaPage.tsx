import { useState } from 'react';
import ProponerPlantaForm from '../components/ProponerPlantaForm';
import RequireRole from '../../../shared/auth/RequireRole';
import type { Planta } from '../api/plantas.api';
import Button from '../../../shared/ui/Button';

// Frente 4 (auditoría): abierta a cualquier usuario autenticado (mismo criterio que "Proponer un
// nuevo uso" en la ficha de planta, RequireRole permitido={() => true} -- solo exige sesión).
function ProponerPlantaPage({ onVolver }: { onVolver: () => void }) {
  const [propuesta, setPropuesta] = useState<Planta | null>(null);

  return (
    <section>
      <Button variant="ghost" onClick={onVolver}>← Volver al catálogo</Button>
      <h2>Proponer una planta medicinal</h2>
      <RequireRole permitido={() => true}>
        {propuesta ? (
          <>
            <p className="advertencia-no-verificado">
              ⚠ "{propuesta.nombreComun}" fue enviada como <strong>Pendiente</strong>, junto con su parte medicinal y uso. No aparecerá en el
              catálogo público —ni como uso verificado— hasta que el equipo y un especialista la revisen y aprueben.
            </p>
            <Button variant="secondary" onClick={() => setPropuesta(null)}>Proponer otra planta</Button>
          </>
        ) : (
          <ProponerPlantaForm onPropuesta={setPropuesta} />
        )}
      </RequireRole>
    </section>
  );
}

export default ProponerPlantaPage;
