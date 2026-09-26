import { Cultivo, GuiaCultivoInput } from '../../domain/entities/cultivo.entity';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { NotFoundError } from '../../domain/errors/domain.errors';

// La guía de cultivo es lo ÚNICO que un especialista en agronomía edita sobre una ficha ya existente. La ve cualquiera
// que consulte la ficha (ver aVistaFichaCultivo); solo la escribe Especialista en agronomía o Administrador.
export class ActualizarGuiaCultivoUseCase {
  constructor(private readonly repo: CultivoRepositoryPort) {}
  async ejecutar(cultivoId: string, input: GuiaCultivoInput, usuario: { id: string; rol: string }): Promise<Cultivo> {
    const cultivo = await this.repo.buscarPorId(cultivoId);
    if (!cultivo) throw new NotFoundError(`Ficha de cultivo no encontrada: ${cultivoId}`);
    cultivo.actualizarGuia(input, usuario.id, usuario.rol, new Date());
    await this.repo.actualizarGuia(cultivo);
    return cultivo;
  }
}
