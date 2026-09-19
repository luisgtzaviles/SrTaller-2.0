const maximumGridPixels = 20_000_000;

function pixels(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > maximumGridPixels) {
    throw new RangeError('Bulk catalog grid dimension is outside its governed range.');
  }
  return `${Math.round(value)}px`;
}

function columns(value: string): string {
  if (!/^52px(?: [1-9]\d{1,3}px)+$/u.test(value)) {
    throw new RangeError('Bulk catalog grid columns are outside their governed format.');
  }
  return value;
}

function duplicateColumns(value: number): string {
  if (!Number.isSafeInteger(value) || value < 2 || value > 10_000) {
    throw new RangeError('Bulk catalog duplicate column count is outside its governed range.');
  }
  return String(value);
}

export function applyBulkCatalogGrid(
  element: HTMLElement | null,
  input: Readonly<{ columns: string; width: number }>,
): void {
  if (!element) return;
  element.style.setProperty('--bulk-grid-columns', columns(input.columns));
  element.style.setProperty('--bulk-grid-width', pixels(input.width));
}

export function applyBulkCatalogCanvas(
  element: HTMLElement | null,
  input: Readonly<{ width: number; height: number }>,
): void {
  if (!element) return;
  element.style.setProperty('--bulk-grid-width', pixels(input.width));
  element.style.setProperty('--bulk-grid-height', pixels(input.height));
}

export function applyBulkCatalogOffset(element: HTMLElement | null, offset: number): void {
  if (!element) return;
  element.style.setProperty('--bulk-grid-offset', pixels(offset));
}

export function applyBulkCatalogDuplicateColumns(element: HTMLElement | null, memberCount: number): void {
  if (!element) return;
  element.style.setProperty('--bulk-grid-duplicate-columns', duplicateColumns(memberCount));
}
