import type { AccessModuleContract } from '../access/index.js';
import type { TenancyModuleContract } from '../tenancy/index.js';

export type CatalogSearch = Pick<
  import('./application/ports/catalog-repository.port.js').CatalogRepositoryPort,
  'search'
>;
export type CatalogItemReader = Pick<
  import('./application/ports/catalog-repository.port.js').CatalogRepositoryPort,
  'getItem'
>;
export type EffectivePriceResolver = Readonly<{
  resolveEffectivePrice: CatalogSearch['search'];
}>;
export type CatalogSnapshotFactory = Readonly<{
  snapshot(item: import('./application/ports/catalog-repository.port.js').CatalogPriceListItem): import('./application/ports/catalog-repository.port.js').CatalogPriceListItem;
}>;

export interface CatalogModuleContract {
  readonly module: 'catalog';
  readonly access: AccessModuleContract;
  readonly tenancy: TenancyModuleContract;
}
