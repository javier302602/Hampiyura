// M-16 · Contrato de compraventa entre comprador y vendedor. Se genera al hacer el pedido y se GUARDA TAL CUAL en el pedido (texto y versión):
// si el modelo cambia después, los pedidos ya hechos conservan el texto que aceptó cada parte.
//
// Qué garantiza y qué no (dicho con claridad, sin promesas que HampiYura no pueda cumplir): la garantía de entrega es una OBLIGACIÓN DEL VENDEDOR,
// aceptada por escrito, con un plazo y con la devolución íntegra del dinero si no cumple. HampiYura es intermediaria tecnológica: NO es parte de la
// compraventa, NO custodia el dinero y NO devuelve pagos por sí misma; registra el contrato, el comprobante y la línea de tiempo, y media en los
// reclamos (puede suspender al vendedor que incumple). Modelo pendiente de revisión legal antes de un uso comercial.
export const VERSION_CONTRATO = 'v1-2026-10';
export const PLAZO_DEVOLUCION_DIAS = 5;       // el vendedor devuelve el monto íntegro en este plazo si no entrega o el producto no es conforme
export const PLAZO_RECEPCION_DIAS = 7;        // el comprador confirma la recepción o reclama dentro de este plazo desde que recibe
export const PORCENTAJE_COMISION = 5;         // comisión de la plataforma sobre ventas (informativa: se paga aparte, no se descuenta del pago directo)

export interface DatosContrato {
  fecha: Date;
  pedidoId?: string;
  comprador: { nombre: string; correo?: string };
  vendedor: { nombre: string; nombreNegocio?: string };
  producto: { nombre: string };
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  costoEnvio: number;
  distanciaKm?: number;
  entregaDias: number;
  medios: string[];
  entrega?: { nombre: string; telefono: string; direccion: string; referencia?: string };
}
export const soles = (n: number) => `S/ ${n.toFixed(2)}`;

export function generarContrato(d: DatosContrato): string {
  const fecha = d.fecha.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  const vendedor = d.vendedor.nombreNegocio ? `${d.vendedor.nombreNegocio} (${d.vendedor.nombre})` : d.vendedor.nombre;
  const entrega = d.entrega ? `${d.entrega.nombre}, tel. ${d.entrega.telefono}, ${d.entrega.direccion}${d.entrega.referencia ? ` (referencia: ${d.entrega.referencia})` : ''}` : '(los datos de entrega que indiques en este pedido)';
  const total = d.subtotal + d.costoEnvio;
  const envioTexto = d.distanciaKm != null
    ? `${soles(d.costoEnvio)} (calculado por la distancia real de ${d.distanciaKm.toFixed(1)} km entre el vendedor y el punto de entrega)`
    : 'No se pudo calcular por distancia (el vendedor no registró su ubicación exacta en el mapa al publicar): coordina el costo de envío directamente con él antes de pagar.';
  return [
    `CONTRATO DE COMPRAVENTA DE PRODUCTO — ${VERSION_CONTRATO}`,
    `${d.pedidoId ? `Pedido ${d.pedidoId.slice(0, 8).toUpperCase()} · ` : ''}Fecha: ${fecha}`,
    '',
    '1. PARTES',
    `COMPRADOR: ${d.comprador.nombre}${d.comprador.correo ? ` (${d.comprador.correo})` : ''}.`,
    `VENDEDOR: ${vendedor}.`,
    'HampiYura participa solo como plataforma tecnológica que pone en contacto a las partes (ver cláusula 6): no es parte de esta compraventa.',
    '',
    '2. OBJETO, PRECIO Y ENVÍO',
    `El vendedor vende y el comprador compra: ${d.cantidad} × "${d.producto.nombre}", al precio de ${soles(d.precioUnitario)} por unidad. Subtotal del producto: ${soles(d.subtotal)}.`,
    `Costo de envío: ${envioTexto}`,
    `TOTAL A PAGAR: ${soles(total)}.`,
    '',
    '3. PAGO',
    `El comprador paga el total DIRECTAMENTE al vendedor, por ${d.medios.length ? d.medios.join(' o ') : 'el medio de cobro que el vendedor registró'}, y sube el comprobante en el pedido. El vendedor confirma en la plataforma cuando recibe el pago, o lo rechaza indicando el motivo. HampiYura no recibe ni retiene este dinero.`,
    '',
    '4. ENTREGA (GARANTÍA DE ENTREGA)',
    `El vendedor se OBLIGA a enviar el producto, conforme a su descripción y en buen estado, a: ${entrega}, dentro de ${d.entregaDias} días calendario contados desde que confirma el pago. Debe marcar el pedido como "Enviado" en la plataforma, con una nota (empresa de transporte, guía o cómo se entregará).`,
    `Si el producto no se entrega dentro de ese plazo, o llega distinto de lo ofrecido, dañado o vencido, el comprador puede abrir un reclamo y el vendedor se OBLIGA a devolver el monto pagado de forma ÍNTEGRA en un máximo de ${PLAZO_DEVOLUCION_DIAS} días calendario, o a entregar el producto conforme si el comprador lo prefiere.`,
    '',
    '5. OBLIGACIONES DEL COMPRADOR',
    `Pagar el total indicado, dar datos de entrega correctos y completos, y confirmar la recepción en la plataforma o reclamar dentro de ${PLAZO_RECEPCION_DIAS} días calendario desde que recibe el producto. No se pueden usar las devoluciones para cobros indebidos: un reclamo falso puede llevar a suspender la cuenta.`,
    '',
    '6. ROL DE HAMPIYURA',
    'HampiYura es intermediaria tecnológica. NO es parte de la compraventa, NO custodia el dinero, NO garantiza por sí misma el pago ni la entrega y NO realiza devoluciones. Sí: (a) guarda este contrato, el comprobante y la línea de tiempo del pedido como evidencia; (b) revisa los reclamos y media entre las partes; (c) puede suspender la cuenta y retirar los productos de un vendedor que incumple o de un comprador que actúa de mala fe.',
    '',
    '7. RECLAMOS',
    'El comprador abre el reclamo desde el pedido (con el motivo) cuando venció el plazo de entrega o no está conforme; el equipo de HampiYura revisa la evidencia registrada, contacta a ambas partes y cierra el reclamo con una resolución por escrito. Lo que las partes acuerden entre sí (entrega tardía, reposición, devolución) queda anotado en el pedido.',
    '',
    '8. DATOS PERSONALES',
    'Los datos de entrega y de contacto solo se usan para cumplir esta compraventa y solo los ven el comprador, el vendedor y, si hay reclamo, el equipo de HampiYura.',
    '',
    '9. PRODUCTOS DE PLANTAS',
    'La información del producto la aporta el vendedor. Los productos con plantas medicinales no sustituyen la consulta con un profesional de la salud ni son un tratamiento verificado.',
    '',
    '10. COMISIÓN Y LEY APLICABLE',
    `HampiYura cobra al vendedor una comisión de ${PORCENTAJE_COMISION}% sobre el subtotal de esta venta (${soles(Math.round(d.subtotal * PORCENTAJE_COMISION) / 100)}, no sobre el envío), que el comprador NO paga y que no se descuenta del pago directo. Se aplican las normas peruanas de compraventa y de protección al consumidor.`,
    '',
    'ACEPTACIÓN: el comprador acepta este contrato al confirmar el pedido; el vendedor se compromete a cumplirlo (plazo de entrega y devolución) al haber publicado el producto con su medio de cobro y su plazo de entrega. Se conserva un registro con fecha de cada aceptación.',
    'Modelo de contrato de la plataforma, pendiente de revisión legal.',
  ].join('\n');
}
