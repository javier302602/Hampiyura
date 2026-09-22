import { useEffect, useState } from 'react';
import { alternarTema, obtenerTemaActual, suscribirseACambiosDeTema, type Tema } from './theme';

export function useTema(): [Tema, () => void] {
  const [tema, setTema] = useState<Tema>(obtenerTemaActual());
  useEffect(() => suscribirseACambiosDeTema(() => setTema(obtenerTemaActual())), []);
  return [tema, () => setTema(alternarTema())];
}
