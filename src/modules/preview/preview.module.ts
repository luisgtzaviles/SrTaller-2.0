import { Module } from '@nestjs/common';

import type { PreviewModuleContract } from './index.js';
import type { KyselyPreviewRepairRepositoryFactory } from './infrastructure/persistence/kysely-preview-repair.repository.js';

@Module({})
export class PreviewModule {
  private declare readonly architectureContract: PreviewModuleContract;
  private declare readonly persistenceAdapter: KyselyPreviewRepairRepositoryFactory;
}
