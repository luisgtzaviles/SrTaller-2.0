import {
  BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException,
  Get, Header, Headers, NotFoundException, Param, Patch, Post, Put, Query,
  ServiceUnavailableException, UnauthorizedException,
} from '@nestjs/common';

import { ContextualAuthorizationError, SensitiveActionReauthenticationError } from '../../access/index.js';
import type { ProtectedRequestEvidence } from '../../access/index.js';
import { CatalogProtectedOperations, CatalogOperationAccessDeniedError } from '../application/catalog-protected-operations.js';
import { CatalogAuthorizationChangedError, CatalogConflictError, CatalogCoverageReviewRequiredError, CatalogInputError, CatalogNotFoundError, CatalogReferenceAlreadyExistsError, CatalogReferenceInUseError, CatalogUnavailableError } from '../domain/catalog-item.js';

type RequestHeaders = Readonly<Record<string, string | string[] | undefined>>;
function header(headers: RequestHeaders, name: string): string | undefined {
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  return typeof found?.[1] === 'string' ? found[1] : undefined;
}
function evidence(headers: RequestHeaders): ProtectedRequestEvidence {
  return Object.freeze({ cookieHeader: header(headers, 'cookie'), origin: header(headers, 'origin'), host: header(headers, 'host'), forwardedProto: header(headers, 'x-forwarded-proto'), fetchSite: header(headers, 'sec-fetch-site'), contentType: header(headers, 'content-type'), csrfToken: header(headers, 'x-sr-csrf-token') });
}
function translate(error: unknown): never {
  if (error instanceof ContextualAuthorizationError) {
    if (error.code === 'AUTHENTICATION_REQUIRED') throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' });
    throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  }
  if (error instanceof SensitiveActionReauthenticationError) throw new ForbiddenException({ code: error.code });
  if (error instanceof CatalogOperationAccessDeniedError || error instanceof CatalogAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  if (error instanceof CatalogInputError) throw new BadRequestException({ code: error.code, parameter: error.parameter });
  if (error instanceof CatalogNotFoundError) throw new NotFoundException({ code: error.code });
  if (error instanceof CatalogReferenceInUseError) throw new ConflictException({ code: error.code });
  if (error instanceof CatalogReferenceAlreadyExistsError) throw new ConflictException({ code: error.code, referenceKind: error.referenceKind, displayName: error.displayName });
  if (error instanceof CatalogCoverageReviewRequiredError) throw new ConflictException({ code: error.code, coverage: error.coverage });
  if (error instanceof CatalogConflictError) throw new ConflictException({ code: error.code });
  if (error instanceof CatalogUnavailableError) throw new ServiceUnavailableException({ code: error.code });
  throw error;
}

@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly operations: CatalogProtectedOperations) {}

  @Get('price-list') @Header('Cache-Control', 'private, no-store')
  async search(@Query() query: Readonly<Record<string, string | undefined>>, @Headers() headers: RequestHeaders) {
    try {
      const includeReferenceCost = query.includeReferenceCost === 'true';
      return await this.operations.search(evidence(headers), {
        query: query.query ?? '', kind: query.kind ?? null, categoryId: query.categoryId ?? null, brandId: query.brandId ?? null,
        page: query.page ? Number(query.page) : 1, pageSize: query.pageSize ? Number(query.pageSize) : 25,
      }, includeReferenceCost);
    } catch (error: unknown) { return translate(error); }
  }

  @Get('references') @Header('Cache-Control', 'private, no-store')
  async references(@Headers() headers: RequestHeaders) {
    try { return await this.operations.listReferences(evidence(headers)); }
    catch (error: unknown) { return translate(error); }
  }

  @Get('administration/references') @Header('Cache-Control', 'private, no-store')
  async administrationReferences(@Headers() headers: RequestHeaders) {
    try { return await this.operations.listAdministrationReferences(evidence(headers)); }
    catch (error: unknown) { return translate(error); }
  }

  @Get('items/:itemId') @Header('Cache-Control', 'private, no-store')
  async item(@Param('itemId') itemId: string, @Headers() headers: RequestHeaders) {
    try {
      const result = await this.operations.getItem(evidence(headers), itemId);
      if (!result) throw new CatalogNotFoundError();
      return result;
    } catch (error: unknown) { return translate(error); }
  }

  @Post('categories') @Header('Cache-Control', 'private, no-store')
  async createCategory(@Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.createCategory(evidence(headers), body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('brands') @Header('Cache-Control', 'private, no-store')
  async createBrand(@Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.createBrand(evidence(headers), body); }
    catch (error: unknown) { return translate(error); }
  }
  @Patch('categories/:categoryId') @Header('Cache-Control', 'private, no-store')
  async updateCategory(@Param('categoryId') categoryId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.updateCategory(evidence(headers), categoryId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Patch('brands/:brandId') @Header('Cache-Control', 'private, no-store')
  async updateBrand(@Param('brandId') brandId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.updateBrand(evidence(headers), brandId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Delete('categories/:categoryId') @Header('Cache-Control', 'private, no-store')
  async deleteCategory(@Param('categoryId') categoryId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.deleteCategory(evidence(headers), categoryId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Delete('brands/:brandId') @Header('Cache-Control', 'private, no-store')
  async deleteBrand(@Param('brandId') brandId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.deleteBrand(evidence(headers), brandId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('categories/merge') @Header('Cache-Control', 'private, no-store')
  async mergeCategories(@Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.mergeCategories(evidence(headers), body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('brands/merge') @Header('Cache-Control', 'private, no-store')
  async mergeBrands(@Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.mergeBrands(evidence(headers), body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('categories/pending/:pendingCategoryValueId/resolve') @Header('Cache-Control', 'private, no-store')
  async resolveCategory(@Param('pendingCategoryValueId') pendingCategoryValueId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.resolveCategory(evidence(headers), pendingCategoryValueId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('brands/pending/:pendingBrandValueId/resolve') @Header('Cache-Control', 'private, no-store')
  async resolveBrand(@Param('pendingBrandValueId') pendingBrandValueId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.resolveBrand(evidence(headers), pendingBrandValueId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('items') @Header('Cache-Control', 'private, no-store')
  async createItem(@Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.createItem(evidence(headers), body); }
    catch (error: unknown) { return translate(error); }
  }
  @Patch('items/:itemId') @Header('Cache-Control', 'private, no-store')
  async updateItem(@Param('itemId') itemId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.updateItem(evidence(headers), itemId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('items/:itemId/base-price') @Header('Cache-Control', 'private, no-store')
  async basePrice(@Param('itemId') itemId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.changeBasePrice(evidence(headers), itemId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('items/:itemId/reference-cost') @Header('Cache-Control', 'private, no-store')
  async referenceCost(@Param('itemId') itemId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.changeReferenceCost(evidence(headers), itemId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Put('items/:itemId/branch-price') @Header('Cache-Control', 'private, no-store')
  async branchPrice(@Param('itemId') itemId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.changeBranchOverride(evidence(headers), itemId, body, false); }
    catch (error: unknown) { return translate(error); }
  }
  @Delete('items/:itemId/branch-price') @Header('Cache-Control', 'private, no-store')
  async revokeBranchPrice(@Param('itemId') itemId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.changeBranchOverride(evidence(headers), itemId, body, true); }
    catch (error: unknown) { return translate(error); }
  }

  @Get('supplier-sources') @Header('Cache-Control', 'private, no-store')
  async supplierSources(@Headers() headers: RequestHeaders) { try { return await this.operations.listSupplierSources(evidence(headers)); } catch (error) { return translate(error); } }
  @Post('supplier-sources') @Header('Cache-Control', 'private, no-store')
  async createSupplierSource(@Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.operations.createSupplierSource(evidence(headers), body); } catch (error) { return translate(error); } }
  @Delete('supplier-sources/:sourceId') @Header('Cache-Control', 'private, no-store')
  async deleteSupplierSource(@Param('sourceId') sourceId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.operations.deleteSupplierSource(evidence(headers), sourceId, body); } catch (error) { return translate(error); } }
  @Get('supplier-versions') @Header('Cache-Control', 'private, no-store')
  async supplierVersions(@Query('sourceId') sourceId: string | undefined, @Headers() headers: RequestHeaders) { try { return await this.operations.listSupplierVersions(evidence(headers), sourceId); } catch (error) { return translate(error); } }
  @Post('supplier-versions') @Header('Cache-Control', 'private, no-store')
  async createSupplierVersion(@Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.operations.createSupplierDraft(evidence(headers), body); } catch (error) { return translate(error); } }
  @Get('supplier-versions/:versionId') @Header('Cache-Control', 'private, no-store')
  async supplierVersion(@Param('versionId') versionId: string, @Query('includeReferenceCost') include: string | undefined, @Headers() headers: RequestHeaders) { try { return await this.operations.getSupplierVersion(evidence(headers), versionId, include === 'true'); } catch (error) { return translate(error); } }
  @Put('supplier-versions/:versionId/draft') @Header('Cache-Control', 'private, no-store')
  async replaceSupplierDraft(@Param('versionId') versionId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.operations.replaceSupplierDraft(evidence(headers), versionId, body); } catch (error) { return translate(error); } }
  @Post('supplier-versions/:versionId/analyze') @Header('Cache-Control', 'private, no-store')
  async analyzeSupplierVersion(@Param('versionId') versionId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.operations.analyzeSupplierVersion(evidence(headers), versionId, body); } catch (error) { return translate(error); } }
  @Put('supplier-versions/:versionId/rows/:rowDecisionId') @Header('Cache-Control', 'private, no-store')
  async decideSupplierRow(@Param('versionId') versionId: string, @Param('rowDecisionId') rowDecisionId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.operations.decideSupplierRow(evidence(headers), versionId, rowDecisionId, body); } catch (error) { return translate(error); } }
  @Put('supplier-versions/:versionId/rows') @Header('Cache-Control', 'private, no-store')
  async decideSupplierRows(@Param('versionId') versionId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.operations.decideSupplierRows(evidence(headers), versionId, body); } catch (error) { return translate(error); } }
  @Post('supplier-versions/:versionId/publish') @Header('Cache-Control', 'private, no-store')
  async publishSupplierVersion(@Param('versionId') versionId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.operations.publishSupplierVersion(evidence(headers), versionId, body); } catch (error) { return translate(error); } }
  @Get('supplier-versions/:leftVersionId/compare/:rightVersionId') @Header('Cache-Control', 'private, no-store')
  async compareSupplierVersions(@Param('leftVersionId') left: string, @Param('rightVersionId') right: string, @Headers() headers: RequestHeaders) { try { return await this.operations.compareSupplierVersions(evidence(headers), left, right); } catch (error) { return translate(error); } }
  @Post('supplier-raw/purge') @Header('Cache-Control', 'private, no-store')
  async purgeSupplierRaw(@Headers() headers: RequestHeaders) { try { return Object.freeze({ purged: await this.operations.purgeSupplierRaw(evidence(headers)) }); } catch (error) { return translate(error); } }
  @Post('retirement-plans') @Header('Cache-Control', 'private, no-store')
  async createRetirementPlan(@Body() body: unknown, @Headers() headers: RequestHeaders) { try { return await this.operations.createRetirementPlan(evidence(headers), body); } catch (error) { return translate(error); } }
  @Post('retirement-plans/:planId/execute') @Header('Cache-Control', 'private, no-store')
  async executeRetirementPlan(@Param('planId') planId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try {
      const input = typeof body === 'object' && body !== null && !Array.isArray(body) ? { ...body, planId } : body;
      return await this.operations.executeRetirementPlan(evidence(headers), input);
    } catch (error) { return translate(error); }
  }
}
