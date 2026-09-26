import { Cultivo } from '../../../entities/cultivo.entity';
import { EstadoValidacion } from '../../../value-objects/estado-validacion.vo';

// RF-251, criterio de aceptación: ningún dato agronómico se muestra si no fue validado
// por un especialista; en ese caso solo se expone el estado y un mensaje de espera.
// Guía de cultivo (Ronda 19): visible para cualquiera, aunque la ficha aún no esté validada, porque solo la escribe un
// especialista en agronomía. Todos los campos null = "pendiente de un especialista".
export interface GuiaCultivoVisible { suelo: string | null; nutrientes: string | null; herramientas: string | null; actualizadaEn: Date | null; }
export type FichaCultivoVisible =
  | ({ disponible: true; guia: GuiaCultivoVisible } & Omit<Cultivo['props'], 'guiaSuelo' | 'guiaNutrientes' | 'guiaHerramientas' | 'guiaEspecialistaId' | 'guiaActualizadaEn'>)
  | { disponible: false; id: string; plantaId: string; estadoValidacion: EstadoValidacion; mensaje: string; guia: GuiaCultivoVisible };

export interface ObtenerFichaCultivoPort { ejecutar(id: string): Promise<FichaCultivoVisible>; }
