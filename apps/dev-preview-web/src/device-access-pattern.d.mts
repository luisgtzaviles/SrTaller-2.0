export const MIN_DEVICE_PATTERN_NODES: 2;
export const MAX_DEVICE_PATTERN_NODES: 9;

export function addDevicePatternNode(pattern: readonly number[], node: number): readonly number[];

export function isDevicePatternValid(pattern: readonly number[]): boolean;
