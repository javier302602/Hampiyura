import { randomUUID } from 'crypto';
import { Cultivo } from '../../domain/entities/cultivo.entity';
import { ValidacionContenido } from '../../domain/entities/validacion-contenido.entity';
import { RegistrarFichaCultivoInput, RegistrarFichaCultivoPort } from '../../domain/ports/in/m03-cultivo/registrar-ficha-cultivo.port';
import { CultivoRepositoryPort } from '../../domain/ports/out/cultivo.repository.port';
import { ValidacionContenidoRepositoryPort } from '../../domain/ports/out/validacion-contenido.repository.port';
export class RegistrarFichaCultivoUseCase implements RegistrarFichaCultivoPort {
  constructor(private readonly repo:CultivoRepositoryPort, private readonly validaciones:ValidacionContenidoRepositoryPort) {}
  async ejecutar(input:RegistrarFichaCultivoInput):Promise<Cultivo> {
    const cultivo=new Cultivo({ ...input, id:randomUUID(), estadoValidacion:'Pendiente' });
    await this.repo.guardar(cultivo);
    await this.validaciones.guardar(new ValidacionContenido({ id:randomUUID(), tipoEntidad:'Cultivo', entidadId:cultivo.props.id, estado:'Pendiente', fecha:new Date(), autorId:cultivo.props.autorId }));
    return cultivo;
  }
}
