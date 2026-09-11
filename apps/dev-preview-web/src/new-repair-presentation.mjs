export function resolveNewRepairPresentation(mode, guidedAvailable = false) {
  return mode === 'guided_v2' && guidedAvailable ? 'guided_v2' : 'classic';
}
