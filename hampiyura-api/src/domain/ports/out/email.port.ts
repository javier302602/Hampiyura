export interface EmailPort { enviarActivacion(correo: string, token: string): Promise<void>; enviarRecuperacion(correo: string, token: string): Promise<void>; }
