import type {
  AccessMatrixRecord,
  AccessRepositoryPort,
} from '../ports/access-repository.port.js';
import { parseAccessTenantScope } from '../access-input.js';

/** Read model only; no productive Access administration surface is exposed. */
export class ListAccessMatrixUseCase {
  constructor(private readonly repository: AccessRepositoryPort) {}

  execute(scope: unknown): Promise<AccessMatrixRecord> {
    return this.repository.listMatrix(parseAccessTenantScope(scope));
  }
}
