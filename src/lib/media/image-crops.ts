export type ImageCropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ModuleImageCropConfig = {
  heroDesktop: ImageCropRect | null;
  heroMobile: ImageCropRect | null;
  thumbnail: ImageCropRect | null;
};

export const emptyModuleImageCropConfig: ModuleImageCropConfig = {
  heroDesktop: null,
  heroMobile: null,
  thumbnail: null,
};

export function parseModuleImageCropConfig(value: unknown): ModuleImageCropConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const source = value as Record<string, unknown>;
  const heroDesktop = parseCropRect(source.heroDesktop);
  const heroMobile = parseCropRect(source.heroMobile);
  const thumbnail = parseCropRect(source.thumbnail);

  if (!heroDesktop && !heroMobile && !thumbnail) return null;
  return { heroDesktop, heroMobile, thumbnail };
}

export function isValidCropRect(value: unknown): value is ImageCropRect {
  return Boolean(parseCropRect(value));
}

function parseCropRect(value: unknown): ImageCropRect | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  const { x, y, width, height } = candidate;
  if (![x, y, width, height].every((part) => typeof part === 'number' && Number.isFinite(part))) return null;

  const rect = { x: x as number, y: y as number, width: width as number, height: height as number };
  const epsilon = 0.00001;
  if (
    rect.x < 0 || rect.y < 0 || rect.width <= 0 || rect.height <= 0
    || rect.x + rect.width > 1 + epsilon || rect.y + rect.height > 1 + epsilon
  ) {
    return null;
  }

  return rect;
}
