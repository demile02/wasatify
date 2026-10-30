export const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
export const PPTX_UNSUPPORTED_MESSAGE =
  'File PPTX belum dapat dikonversi otomatis di server saat ini. Ekspor PPTX ke PDF terlebih dahulu agar dapat ditampilkan sebagai slide.';
const PPTX_FAILED_MESSAGE = 'Konversi PPTX membutuhkan worker/server renderer. Gunakan PDF untuk saat ini.';

export function isPptxFile(file: File) {
  return file.type === PPTX_MIME || file.name.toLowerCase().endsWith('.pptx');
}

export function normalizeInfographicError(message?: string | null) {
  if (!message) return null;
  const normalized = message.toLowerCase();
  if (normalized.includes('pptx') || normalized.includes('libreoffice') || normalized.includes('worker')) {
    return PPTX_FAILED_MESSAGE;
  }
  return message;
}

