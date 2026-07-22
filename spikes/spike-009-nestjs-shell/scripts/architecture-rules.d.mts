export function inspectSource(name: string, source: string): string[];
export function findImportCycle(graph: ReadonlyMap<string, readonly string[]>): string | undefined;
