export const assignmentFileBucket = 'assignment-submissions';
export const maxAssignmentFileSize = 10 * 1024 * 1024;

const mimeByExtension: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const assignmentFileAccept = Object.keys(mimeByExtension)
  .map((extension) => `.${extension}`)
  .join(',');

export function getAssignmentFileDetails(file: Pick<File, 'name' | 'size' | 'type'>) {
  const extension = file.name.split('.').pop()?.toLocaleLowerCase() ?? '';
  const mimeType = mimeByExtension[extension];
  if (!mimeType) return { error: 'Format berkas harus PDF, Word, Excel, PowerPoint, TXT, JPG, PNG, atau WebP.' } as const;
  if (file.type && file.type !== mimeType && file.type !== 'application/octet-stream') {
    return { error: 'Tipe berkas tidak cocok dengan ekstensi namanya.' } as const;
  }
  if (file.size < 1 || file.size > maxAssignmentFileSize) {
    return { error: 'Ukuran berkas maksimal 10 MB.' } as const;
  }
  return { extension, mimeType } as const;
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
