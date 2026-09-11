export const MIN_DEVICE_PATTERN_NODES = 2;
export const MAX_DEVICE_PATTERN_NODES = 9;

export function addDevicePatternNode(pattern, node) {
  if (!Number.isInteger(node) || node < 1 || node > MAX_DEVICE_PATTERN_NODES || pattern.includes(node)) return pattern;
  return [...pattern, node];
}

export function isDevicePatternValid(pattern) {
  return pattern.length >= MIN_DEVICE_PATTERN_NODES
    && pattern.length <= MAX_DEVICE_PATTERN_NODES
    && pattern.every((node) => Number.isInteger(node) && node >= 1 && node <= MAX_DEVICE_PATTERN_NODES)
    && new Set(pattern).size === pattern.length;
}
