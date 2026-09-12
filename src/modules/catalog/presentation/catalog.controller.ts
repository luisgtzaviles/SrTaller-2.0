import {
  BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException,
  Get, Header, Headers, NotFoundException, Param, Patch, Post, Put, Query,
  ServiceUnavailableException, UnauthorizedException,
} from '@nestjs/common';

import { ContextualAuthorizationError } from '../../access/index.js';
import type { ProtectedRequestEvidence } from '../../access/index.js';
import { CatalogProtectedOperations, CatalogOperationAccessDeniedError } from '../application/catalog-protected-operations.js';
import { CatalogAuthorizationChangedError, CatalogConflictError, CatalogInputError, CatalogNotFoundError, CatalogUnavailableError } from '../domain/catalog-item.js';

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
  if (error instanceof CatalogOperationAccessDeniedError || error instanceof CatalogAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  if (error instanceof CatalogInputError) throw new BadRequestException({ code: error.code, parameter: error.parameter });
  if (error instanceof CatalogNotFoundError) throw new NotFoundException({ code: error.code });
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
  @Post('categories/pending') @Header('Cache-Control', 'private, no-store')
  async createPendingCategory(@Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.createPendingCategory(evidence(headers), body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('brands/pending') @Header('Cache-Control', 'private, no-store')
  async createPendingBrand(@Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.createPendingBrand(evidence(headers), body); }
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
  @Post('categories/:categoryId/resolve') @Header('Cache-Control', 'private, no-store')
  async resolveCategory(@Param('categoryId') categoryId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.resolveCategory(evidence(headers), categoryId, body); }
    catch (error: unknown) { return translate(error); }
  }
  @Post('brands/:brandId/resolve') @Header('Cache-Control', 'private, no-store')
  async resolveBrand(@Param('brandId') brandId: string, @Body() body: unknown, @Headers() headers: RequestHeaders) {
    try { return await this.operations.resolveBrand(evidence(headers), brandId, body); }
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
}
