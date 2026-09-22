import { Moon, Sun } from 'lucide-react';
import IconButton from '../ui/IconButton';
import { useTema } from './useTema';

interface Props {
  onBrand?: boolean;
}

// Hasta ahora la app solo respondía a prefers-color-scheme del sistema operativo -- no había
// ninguna forma de que la persona lo cambiara desde la propia app. Reusa los mismos tokens de
// tema ya verificados en rondas anteriores (login, perfil, footer, etc.); esto solo agrega el
// control manual + persistencia, no una paleta nueva.
function ThemeToggle({ onBrand }: Props) {
  const [tema, alternar] = useTema();
  const esOscuro = tema === 'dark';
  return (
    <IconButton
      icon={esOscuro ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onBrand={onBrand}
      onClick={alternar}
    />
  );
}

export default ThemeToggle;
