import { AlertTriangle } from 'lucide-react';

interface Props {
  title?: string;
  description: string;
}

// Reemplaza "<p>{error}</p>" sin estilo (varios casos ni siquiera usaban .error-formulario, ver
// auditoría) -- usado desde HomePage; el resto de la app se migra en sus propias etapas.
function ErrorState({ title = 'Algo no salió bien', description }: Props) {
  return (
    <div className="state-block state-block-error" role="alert">
      <span className="state-block-icon"><AlertTriangle size={22} aria-hidden="true" /></span>
      <p className="state-block-title">{title}</p>
      <p className="state-block-desc">{description}</p>
    </div>
  );
}

export default ErrorState;
