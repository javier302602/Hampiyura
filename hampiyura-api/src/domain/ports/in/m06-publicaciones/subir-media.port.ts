export interface SubirMediaInput { nombreOriginal: string; contenidoBase64: string; }
export interface SubirMediaPort { ejecutar(input: SubirMediaInput): Promise<{ url: string }>; }
