import { Usuario } from '../../../entities/usuario.entity';

// No existía ningún endpoint para que un usuario ya autenticado recupere sus propios datos
// (login solo devuelve id/correo/rol, y el JWT solo trae sub+rol) -- sin esto, "Perfil básico"
// es literalmente irrecuperable tras un refresh de página. Se agrega ahora porque es
// funcionalidad núcleo de M-01, no una comodidad de UI (nunca expone contraseñaHash).
export type PerfilVisible = Omit<Usuario['props'], 'contraseñaHash'>;
export interface ObtenerPerfilPort { ejecutar(usuarioId: string): Promise<PerfilVisible>; }
