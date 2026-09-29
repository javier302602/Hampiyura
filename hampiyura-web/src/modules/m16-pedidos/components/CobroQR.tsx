import { QRCodeSVG } from 'qrcode.react';

// M-16 · Código QR REAL (generado en tu navegador, sin ningún servicio externo) con los datos de pago en texto plano.
// A propósito NO pretende ser un QR de pago de Yape/Plin ni "escanea y paga solo": HampiYura no tiene forma de generar
// eso de verdad (es un formato propio de cada app), así que sería fingir una función que no existe. Sirve para algo
// real: cualquier lector de QR muestra el texto, útil para copiar el número/monto rápido o compartirlo con quien va a
// pagar por ti.
interface Props { medio: string; numero: string; monto: string; vendedor: string; concepto: string }
function CobroQR({ medio, numero, monto, vendedor, concepto }: Props) {
  const texto = `HampiYura — Pagar por ${medio}\nNúmero: ${numero}\nA nombre de: ${vendedor}\nMonto: ${monto}\nConcepto: ${concepto}`;
  return (
    <div className="cobro-qr">
      <QRCodeSVG value={texto} size={132} level="M" marginSize={2} />
      <p className="comentario-meta">Código QR con estos datos en texto (no abre {medio} automáticamente: ábrelo tú y paga; sirve para copiar el número rápido o compartirlo).</p>
    </div>
  );
}

export default CobroQR;
