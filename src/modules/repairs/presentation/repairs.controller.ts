import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  Headers,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
  ServiceUnavailableException,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';

import { ContextualAuthorizationError } from '../../access/index.js';
import type { ProtectedRequestEvidence } from '../../access/index.js';

import {
  RepairOperationAccessDeniedError,
  RepairProtectedOperations,
} from '../application/repair-protected-operations.js';

import {
  ListRepairsQueryError,
  ListRepairsUseCase,
} from '../application/use-cases/list-repairs.use-case.js';
import type { ListRepairsResult } from '../application/use-cases/list-repairs.use-case.js';
import {
  GetRepairDetailInputError,
  GetRepairDetailUseCase,
  RepairDetailNotFoundError,
} from '../application/use-cases/get-repair-detail.use-case.js';
import {
  GetRepairEvidenceContentInputError,
  RepairEvidenceContentNotFoundError,
} from '../application/use-cases/get-repair-evidence-content.use-case.js';
import {
  AddRepairOperationalNoteAuthorizationError,
  AddRepairOperationalNoteConflictError,
  AddRepairOperationalNoteInputError,
  AddRepairOperationalNoteUseCase,
  RepairOperationalNoteRepairNotFoundError,
} from '../application/use-cases/add-repair-operational-note.use-case.js';
import {
  CreateRepairAuthorizationError,
  CreateRepairConflictError,
  CreateRepairInputError,
} from '../application/use-cases/create-repair.use-case.js';
import {
  CorrectRepairEquipmentAuthorizationError,
  CorrectRepairEquipmentConflictError,
  CorrectRepairEquipmentInputError,
  RepairEquipmentCorrectionNotFoundError,
} from '../application/use-cases/correct-repair-equipment.use-case.js';
import { NewRepairPolicyAuthorizationChangedError, NewRepairPolicyConcurrencyConflictError, NewRepairPolicyInputError } from '../application/new-repair-policy.service.js';
import {
  RepairBrandAuthorizationChangedError,
  RepairBrandConcurrencyConflictError,
  RepairBrandDuplicateError,
  RepairBrandInputError,
  RepairBrandNotFoundError,
  RepairBrandPendingNotFoundError,
} from '../application/repair-brand-catalog.service.js';
import { RepairDeviceTypeAuthorizationChangedError, RepairDeviceTypeConcurrencyConflictError, RepairDeviceTypeDuplicateError, RepairDeviceTypeInputError, RepairDeviceTypeNotFoundError, RepairDeviceTypePendingNotFoundError } from '../application/repair-device-type-catalog.service.js';
import {
  RepairModelAuthorizationChangedError,
  RepairModelConcurrencyConflictError,
  RepairModelDuplicateError,
  RepairModelInputError,
  RepairModelNotFoundError,
  RepairModelPendingNotFoundError,
} from '../application/repair-model-catalog.service.js';
import {
  RepairRiskAuthorizationChangedError,
  RepairRiskConcurrencyConflictError,
  RepairRiskDuplicateError,
  RepairRiskInputError,
  RepairRiskNotFoundError,
} from '../application/repair-risk-catalog.service.js';
import {
  RepairProblemCategoryAuthorizationChangedError,
  RepairProblemCategoryConcurrencyConflictError,
  RepairProblemCategoryDeleteNotAllowedError,
  RepairProblemCategoryDuplicateError,
  RepairProblemCategoryInputError,
  RepairProblemCategoryNotFoundError,
  RepairProblemPendingNotFoundError,
} from '../application/repair-problem-category-catalog.service.js';
import {
  RepairProblemClassificationAuthorizationChangedError,
  RepairProblemClassificationConflictError,
  RepairProblemClassificationInputError,
  RepairProblemClassificationNotFoundError,
} from '../application/change-repair-problem-classification.service.js';

type RepairQuery = Readonly<Record<string, string | string[] | undefined>>;
type RepairRequestHeaders = Readonly<Record<string, string | string[] | undefined>>;

function headerValue(headers: RepairRequestHeaders, name: string): string | undefined {
  const direct = headers[name];
  if (typeof direct === 'string') return direct;
  if (direct !== undefined) return undefined;
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  return typeof entry?.[1] === 'string' ? entry[1] : undefined;
}

export function repairProtectedRequestEvidence(
  headers: RepairRequestHeaders,
): ProtectedRequestEvidence {
  return Object.freeze({
    cookieHeader: headerValue(headers, 'cookie'),
    origin: headerValue(headers, 'origin'),
    host: headerValue(headers, 'host'),
    forwardedProto: headerValue(headers, 'x-forwarded-proto'),
    fetchSite: headerValue(headers, 'sec-fetch-site'),
    contentType: headerValue(headers, 'content-type'),
    csrfToken: headerValue(headers, 'x-sr-csrf-token'),
  });
}

function translateAuthorizationError(error: unknown): void {
  if (error instanceof ContextualAuthorizationError) {
    if (error.code === 'AUTHENTICATION_REQUIRED') {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' });
    }
    throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  }
  if (error instanceof RepairOperationAccessDeniedError) {
    throw new ForbiddenException({ code: 'ACCESS_DENIED' });
  }
}

const repairStatusPresentation = Object.freeze({
  pending: Object.freeze({ label: 'Pendiente', tone: 'neutral' as const }),
  diagnosing: Object.freeze({ label: 'En diagnóstico', tone: 'info' as const }),
  awaiting_authorization: Object.freeze({ label: 'Espera de autorización', tone: 'warning' as const }),
  awaiting_part: Object.freeze({ label: 'Espera de refacción', tone: 'warning' as const }),
  repairing: Object.freeze({ label: 'En reparación', tone: 'info' as const }),
  reviewing: Object.freeze({ label: 'En revisión', tone: 'info' as const }),
  ready: Object.freeze({ label: 'Listo', tone: 'success' as const }),
  unsuccessful: Object.freeze({ label: 'No quedó', tone: 'neutral' as const }),
  cancelled: Object.freeze({ label: 'Cancelado', tone: 'neutral' as const }),
  delivered: Object.freeze({ label: 'Entregado', tone: 'success' as const }),
});

const custodyStatusPresentation = Object.freeze({
  active: Object.freeze({ label: 'En tienda', tone: 'neutral' as const }),
  ended: Object.freeze({ label: 'Entregado', tone: 'neutral' as const }),
});

function response(page: ListRepairsResult) {
  return {
    items: page.items.map((item) => ({
      id: item.id,
      folio: item.folio,
      receivedAt: item.receivedAt,
      customer: {
        name: item.customerName,
        phone: item.customerPhone,
      },
      device: {
        brand: item.deviceBrand.effectiveLabel,
        model: item.canonicalModel.effectiveLabel,
        label: [item.deviceBrand.effectiveLabel, item.canonicalModel.effectiveLabel].filter(Boolean).join(' ') || 'Equipo sin identificar',
      },
      reportedIssue: item.reportedIssue,
      technician: item.technicianId && item.technicianDisplayName
        ? { id: item.technicianId, displayName: item.technicianDisplayName }
        : null,
      repairStatus: {
        code: item.repairStatus,
        ...repairStatusPresentation[item.repairStatus],
      },
      custody: {
        code: item.custodyStatus,
        ...custodyStatusPresentation[item.custodyStatus],
      },
    })),
    pagination: {
      page: page.page,
      pageSize: page.pageSize,
      totalCount: page.totalCount,
      hasNextPage: page.hasNextPage,
    },
    unfilteredCount: page.unfilteredCount,
    facets: {
      technicians: page.technicians,
    },
  };
}

function detailResponse(item: Awaited<ReturnType<GetRepairDetailUseCase['execute']>>) {
  return {
    id: item.id,
    folio: item.folio,
    customer: {
      name: item.customerName,
      phone: item.customerPhone,
    },
    receivedDevice: {
      type: item.deviceType,
      brand: item.deviceBrand.effectiveLabel,
      model: item.canonicalModel.effectiveLabel,
      label: [item.deviceBrand.effectiveLabel, item.canonicalModel.effectiveLabel].filter(Boolean).join(' ') || 'Equipo sin identificar',
      correction: {
        version: item.equipmentVersion,
        capturedBrand: item.capturedBrand,
        canonicalBrandId: item.canonicalBrandId,
        capturedModel: item.capturedModel,
        canonicalModelId: item.canonicalModelId,
      },
      color: item.deviceColor,
      identifier: item.deviceIdentifier,
      identifierUnavailable: item.deviceIdentifierUnavailable,
      distinctiveSigns: item.distinctiveSigns,
      accessories: {
        simIncluded: item.simIncluded,
        memoryCardIncluded: item.memoryCardIncluded,
        other: item.otherAccessories,
      },
    },
    intake: {
      receivedAt: item.receivedAt,
      receivedBy: item.receivedById && item.receivedByDisplayName
        ? { id: item.receivedById, displayName: item.receivedByDisplayName }
        : null,
      reportedIssue: item.reportedIssue,
      reportedProblems: item.problemClassifications.filter((problem) => problem.stage === 'intake').map((problem) => ({ problemCaptureId: problem.problemCaptureId, categoryId: problem.categoryId, label: problem.label, rawLabel: problem.rawLabel, status: problem.status, stage: problem.stage })),
      customerNarrative: item.customerNarrative,
      physicalConditionSummary: item.physicalConditionSummary,
      documentedRiskSummary: item.documentedRiskSummary,
      acceptedInterventionRisks: item.acceptedInterventionRisks.map((risk) => Object.freeze({ label: risk.label })),
      receivedPowerState: item.receivedPowerState,
      deviceAccessType: item.deviceAccessType,
      initialBudgetAmountMinor: item.initialBudgetAmountMinor,
      newRepairPolicyVersion: item.newRepairPolicyVersion,
      warrantyReviewRequested: item.warrantyReviewRequested,
      previousRepairId: item.previousRepairId,
      deliveredByName: item.deliveredByName,
      estimatedDeliveryAt: item.estimatedDeliveryAt,
    },
    problemClassifications: item.problemClassifications.flatMap((category) => category.stage === 'post_intake' && category.categoryId ? [{ categoryId: category.categoryId, label: category.label, status: category.status === 'pending' ? 'active' : category.status }] : []),
    currentSituation: {
      repairStatus: {
        code: item.repairStatus,
        ...repairStatusPresentation[item.repairStatus],
      },
      location: item.currentLocation,
      custody: {
        code: item.custodyStatus,
        ...custodyStatusPresentation[item.custodyStatus],
      },
      technician: item.technicianId && item.technicianDisplayName
        ? { id: item.technicianId, displayName: item.technicianDisplayName }
        : null,
      technicianSummary: item.technicianSummary,
      workflowVersion: item.workflowSummary.version,
      workflowSource: item.workflowSummary.source,
      locationVersion: item.locationVersion,
      locationSource: item.locationSource,
    },
    timeline: {
      items: item.timeline.items.map((entry) => ({
        id: entry.id,
        occurredAt: entry.occurredAt,
        type: entry.type,
        actor: {
          id: entry.actorId,
          displayName: entry.actorDisplayName,
        },
        title: entry.title,
        body: entry.body,
        source: entry.source,
      })),
      totalCount: item.timeline.totalCount,
      limit: item.timeline.limit,
    },
    evidence: {
      items: item.evidence.items.map((entry) => {
        const contentUrl = `/api/repairs/${encodeURIComponent(item.id)}/evidence/${encodeURIComponent(entry.id)}/content`;
        return {
          id: entry.id,
          kind: entry.kind,
          category: entry.category,
          capturedAt: entry.capturedAt,
          uploadedAt: entry.uploadedAt,
          uploadedBy: entry.uploadedBy,
          mimeType: entry.mimeType,
          width: entry.width,
          height: entry.height,
          thumbnailUrl: contentUrl,
          contentUrl,
          caption: entry.caption,
        };
      }),
      totalCount: item.evidence.totalCount,
      limit: item.evidence.limit,
    },
  };
}

function operationalNoteResponse(
  item: Awaited<ReturnType<AddRepairOperationalNoteUseCase['execute']>>,
) {
  return {
    item: {
      id: item.id,
      type: item.type,
      occurredAt: item.occurredAt,
      actor: { id: item.actorId, displayName: item.actorDisplayName },
      title: item.title,
      body: item.body,
      source: item.source,
    },
  };
}

function operationalRiskResponse(items: Awaited<ReturnType<RepairProtectedOperations['listOperationalRepairRisks']>>) {
  return {
    items: items.map((risk) => ({
      riskId: risk.riskId,
      code: risk.code,
      label: risk.canonicalLabel,
      scope: risk.scope,
    })),
  };
}

function adminRiskResponse(items: Awaited<ReturnType<RepairProtectedOperations['listAdminRepairRisks']>>) {
  return {
    items: items.map((risk) => ({
      riskId: risk.riskId,
      code: risk.code,
      label: risk.canonicalLabel,
      scope: risk.scope,
      status: risk.status,
      version: risk.version,
      usageCount: risk.usageCount,
      createdAt: risk.createdAt,
      updatedAt: risk.updatedAt,
    })),
  };
}

function riskMutationInput(riskId: string, request: unknown): unknown {
  if (typeof request !== 'object' || request === null || Array.isArray(request)) return request;
  return { ...(request as Readonly<Record<string, unknown>>), riskId };
}

function problemCategoryMutationInput(categoryId: string, request: unknown): unknown {
  if (typeof request !== 'object' || request === null || Array.isArray(request)) return request;
  return { ...(request as Readonly<Record<string, unknown>>), categoryId };
}

function problemCategoryResponse(items: Awaited<ReturnType<RepairProtectedOperations['listAdminProblemCategories']>>) {
  return { items: items.map((category) => ({ categoryId: category.categoryId, code: category.code, label: category.canonicalLabel, scope: category.scope, status: category.status, version: category.version, usageCount: category.usageCount, deletable: category.deletable, createdAt: category.createdAt, updatedAt: category.updatedAt })) };
}

function pendingProblemMutationInput(pendingProblemValueId: string, request: unknown): unknown {
  if (typeof request !== 'object' || request === null || Array.isArray(request)) return request;
  return { ...(request as Readonly<Record<string, unknown>>), pendingProblemValueId };
}

function pendingProblemResponse(items: Awaited<ReturnType<RepairProtectedOperations['listPendingProblems']>>) {
  return { items: items.map((pending) => ({ pendingProblemValueId: pending.pendingProblemValueId, rawLabel: pending.rawLabel, status: pending.resolutionStatus, canonicalCategoryId: pending.canonicalCategoryId, canonicalLabel: pending.canonicalLabel, version: pending.version, usageCount: pending.usageCount, firstSeenAt: pending.firstSeenAt, lastSeenAt: pending.lastSeenAt })) };
}

function brandMutationInput(brandId: string, request: unknown): unknown {
  if (typeof request !== 'object' || request === null || Array.isArray(request)) return request;
  return { ...(request as Readonly<Record<string, unknown>>), brandId };
}

function pendingBrandMutationInput(pendingBrandValueId: string, request: unknown): unknown {
  if (typeof request !== 'object' || request === null || Array.isArray(request)) return request;
  return { ...(request as Readonly<Record<string, unknown>>), pendingBrandValueId };
}
function deviceTypeMutationInput(deviceTypeId: string, request: unknown): unknown { if (typeof request !== 'object' || request === null || Array.isArray(request)) return request; return { ...(request as Readonly<Record<string, unknown>>), deviceTypeId }; }
function pendingDeviceTypeMutationInput(pendingDeviceTypeValueId: string, request: unknown): unknown { if (typeof request !== 'object' || request === null || Array.isArray(request)) return request; return { ...(request as Readonly<Record<string, unknown>>), pendingDeviceTypeValueId }; }
function operationalDeviceTypeResponse(items: Awaited<ReturnType<RepairProtectedOperations['listOperationalRepairDeviceTypes']>>) { return { items: items.map((item) => ({ deviceTypeId: item.deviceTypeId, label: item.canonicalLabel, scope: item.scope })) }; }
function adminDeviceTypeResponse(items: Awaited<ReturnType<RepairProtectedOperations['listAdminRepairDeviceTypes']>>) { return { items: items.map((item) => ({ deviceTypeId: item.deviceTypeId, code: item.code, label: item.canonicalLabel, scope: item.scope, status: item.status, version: item.version, usageCount: item.usageCount, createdAt: item.createdAt, updatedAt: item.updatedAt })) }; }
function pendingDeviceTypeResponse(items: Awaited<ReturnType<RepairProtectedOperations['listPendingRepairDeviceTypes']>>) { return { items: items.map((item) => ({ pendingDeviceTypeValueId: item.pendingDeviceTypeValueId, rawLabel: item.rawLabel, status: item.resolutionStatus, canonicalDeviceTypeId: item.canonicalDeviceTypeId, canonicalLabel: item.canonicalLabel, version: item.version, usageCount: item.usageCount, firstSeenAt: item.firstSeenAt, lastSeenAt: item.lastSeenAt })) }; }

function modelMutationInput(modelId: string, request: unknown): unknown {
  if (typeof request !== 'object' || request === null || Array.isArray(request)) return request;
  return { ...(request as Readonly<Record<string, unknown>>), modelId };
}

function pendingModelMutationInput(pendingModelValueId: string, request: unknown): unknown {
  if (typeof request !== 'object' || request === null || Array.isArray(request)) return request;
  return { ...(request as Readonly<Record<string, unknown>>), pendingModelValueId };
}

function operationalBrandResponse(items: Awaited<ReturnType<RepairProtectedOperations['listOperationalRepairBrands']>>) {
  return { items: items.map((brand) => ({ brandId: brand.brandId, label: brand.canonicalLabel, scope: brand.scope })) };
}

function adminBrandResponse(items: Awaited<ReturnType<RepairProtectedOperations['listAdminRepairBrands']>>) {
  return { items: items.map((brand) => ({ brandId: brand.brandId, code: brand.code, label: brand.canonicalLabel, scope: brand.scope, status: brand.status, version: brand.version, usageCount: brand.usageCount, createdAt: brand.createdAt, updatedAt: brand.updatedAt })) };
}

function pendingBrandResponse(items: Awaited<ReturnType<RepairProtectedOperations['listPendingRepairBrands']>>) {
  return { items: items.map((pending) => ({ pendingBrandValueId: pending.pendingBrandValueId, rawLabel: pending.rawLabel, status: pending.resolutionStatus, canonicalBrandId: pending.canonicalBrandId, canonicalLabel: pending.canonicalLabel, version: pending.version, usageCount: pending.usageCount, firstSeenAt: pending.firstSeenAt, lastSeenAt: pending.lastSeenAt })) };
}

function operationalModelResponse(items: Awaited<ReturnType<RepairProtectedOperations['listOperationalRepairModels']>>) {
  return { items: items.map((model) => ({ modelId: model.modelId, brandId: model.canonicalBrandId, brandLabel: model.brandLabel, label: model.canonicalLabel, scope: model.scope })) };
}

function adminModelResponse(items: Awaited<ReturnType<RepairProtectedOperations['listAdminRepairModels']>>) {
  return { items: items.map((model) => ({ modelId: model.modelId, brandId: model.canonicalBrandId, brandLabel: model.brandLabel, code: model.code, label: model.canonicalLabel, scope: model.scope, status: model.status, version: model.version, usageCount: model.usageCount, createdAt: model.createdAt, updatedAt: model.updatedAt })) };
}

function pendingModelResponse(items: Awaited<ReturnType<RepairProtectedOperations['listPendingRepairModels']>>) {
  return { items: items.map((pending) => ({ pendingModelValueId: pending.pendingModelValueId, brandId: pending.canonicalBrandId, brandLabel: pending.brandLabel, rawBrandLabel: pending.rawBrandLabel, rawModelLabel: pending.rawModelLabel, status: pending.resolutionStatus, canonicalModelId: pending.canonicalModelId, canonicalModelLabel: pending.canonicalModelLabel, version: pending.version, usageCount: pending.usageCount, firstSeenAt: pending.firstSeenAt, lastSeenAt: pending.lastSeenAt })) };
}

@Controller('api/repairs')
export class RepairsController {
  constructor(private readonly operations: RepairProtectedOperations) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  async getWorklist(
    @Headers() headers: RepairRequestHeaders,
    @Query() query: RepairQuery,
  ) {
    try {
      return response(await this.operations.listRepairs(
        repairProtectedRequestEvidence(headers),
        query,
      ));
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof ListRepairsQueryError) {
        throw new BadRequestException({
          code: 'REPAIRS_QUERY_INVALID',
          parameter: error.parameter,
        });
      }
      if (error instanceof Error && error.name.includes('Database')) {
        throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      }
      throw new InternalServerErrorException({ code: 'REPAIRS_READ_FAILED' });
    }
  }

  @Get('technicians')
  @Header('Cache-Control', 'private, no-store')
  async getTechnicians(@Headers() headers: RepairRequestHeaders) {
    try {
      return {
        items: await this.operations.listRepairTechnicians(
          repairProtectedRequestEvidence(headers),
        ),
      };
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof Error && error.name.includes('Database')) throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      throw new InternalServerErrorException({ code: 'REPAIR_TECHNICIANS_READ_FAILED' });
    }
  }

  @Post()
  @Header('Cache-Control', 'private, no-store')
  async createRepair(
    @Headers() headers: RepairRequestHeaders,
    @Body() request: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.operations.createRepair(
        repairProtectedRequestEvidence(headers),
        { request },
      );
      response.setHeader('X-Correlation-ID', result.correlationId);
      return {
        id: result.repairId,
        folio: result.folio,
        customer: { id: result.customerId, name: result.customerName, phone: result.customerPhone },
        receivedAt: result.occurredAt,
        newRepairPolicyVersion: result.newRepairPolicyVersion,
      };
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof CreateRepairInputError) {
        throw new BadRequestException({ code: 'REPAIR_CREATE_INVALID', parameter: error.parameter });
      }
      if (error instanceof CreateRepairConflictError) {
        throw new ConflictException({ code: 'REPAIR_CREATE_IDEMPOTENCY_CONFLICT' });
      }
      if (error instanceof CreateRepairAuthorizationError) {
        throw new ForbiddenException({ code: 'ACCESS_DENIED' });
      }
      if (error instanceof Error && error.name.includes('Database')) {
        throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      }
      throw new InternalServerErrorException({ code: 'REPAIR_CREATE_FAILED' });
    }
  }

  @Get('new-repair-policy')
  @Header('Cache-Control', 'private, no-store')
  async getOperationalNewRepairPolicy(@Headers() headers: RepairRequestHeaders) {
    try {
      return await this.operations.readOperationalNewRepairPolicy(repairProtectedRequestEvidence(headers));
    } catch (error: unknown) {
      translateAuthorizationError(error);
      throw new ServiceUnavailableException({ code: 'NEW_REPAIR_POLICY_READ_FAILED' });
    }
  }

  @Get('risks')
  @Header('Cache-Control', 'private, no-store')
  async getOperationalRepairRisks(@Headers() headers: RepairRequestHeaders) {
    try {
      return operationalRiskResponse(await this.operations.listOperationalRepairRisks(repairProtectedRequestEvidence(headers)));
    } catch (error: unknown) {
      translateAuthorizationError(error);
      throw new ServiceUnavailableException({ code: 'REPAIR_RISKS_READ_FAILED' });
    }
  }

  @Get('problem-categories')
  @Header('Cache-Control', 'private, no-store')
  async getOperationalProblemCategories(@Headers() headers: RepairRequestHeaders) {
    try { return problemCategoryResponse(await this.operations.listOperationalProblemCategories(repairProtectedRequestEvidence(headers))); }
    catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_PROBLEM_CATEGORIES_READ_FAILED' }); }
  }

  @Get('new-repair/problem-categories')
  @Header('Cache-Control', 'private, no-store')
  async getIntakeProblemCategories(@Headers() headers: RepairRequestHeaders) {
    try { return problemCategoryResponse(await this.operations.listIntakeProblemCategories(repairProtectedRequestEvidence(headers))); }
    catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_PROBLEM_CATEGORIES_READ_FAILED' }); }
  }

  @Get('brands')
  @Header('Cache-Control', 'private, no-store')
  async getOperationalRepairBrands(@Headers() headers: RepairRequestHeaders, @Query('q') query: string | undefined) {
    try { return operationalBrandResponse(await this.operations.listOperationalRepairBrands(repairProtectedRequestEvidence(headers), query)); }
    catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_BRANDS_READ_FAILED' }); }
  }

  @Get('device-types')
  @Header('Cache-Control', 'private, no-store')
  async getOperationalRepairDeviceTypes(@Headers() headers: RepairRequestHeaders, @Query('q') query: string | undefined) { try { return operationalDeviceTypeResponse(await this.operations.listOperationalRepairDeviceTypes(repairProtectedRequestEvidence(headers), query)); } catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_DEVICE_TYPES_READ_FAILED' }); } }

  @Get('configuration/catalogs/device-types')
  @Header('Cache-Control', 'private, no-store')
  async getAdminRepairDeviceTypes(@Headers() headers: RepairRequestHeaders) { try { return adminDeviceTypeResponse(await this.operations.listAdminRepairDeviceTypes(repairProtectedRequestEvidence(headers))); } catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_DEVICE_TYPES_READ_FAILED' }); } }
  @Get('configuration/catalogs/device-types/pending')
  @Header('Cache-Control', 'private, no-store')
  async getPendingRepairDeviceTypes(@Headers() headers: RepairRequestHeaders) { try { return pendingDeviceTypeResponse(await this.operations.listPendingRepairDeviceTypes(repairProtectedRequestEvidence(headers))); } catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_DEVICE_TYPES_READ_FAILED' }); } }
  @Post('configuration/catalogs/device-types')
  @Header('Cache-Control', 'private, no-store')
  async createRepairDeviceType(@Headers() headers: RepairRequestHeaders, @Body() request: unknown) { try { return { item: adminDeviceTypeResponse([await this.operations.createRepairDeviceType(repairProtectedRequestEvidence(headers), request)]).items[0] }; } catch (error: unknown) { this.translateDeviceTypeMutationError(error); } }
  @Put('configuration/catalogs/device-types/:deviceTypeId')
  @Header('Cache-Control', 'private, no-store')
  async renameRepairDeviceType(@Headers() headers: RepairRequestHeaders, @Param('deviceTypeId') deviceTypeId: string, @Body() request: unknown) { try { return { item: adminDeviceTypeResponse([await this.operations.renameRepairDeviceType(repairProtectedRequestEvidence(headers), deviceTypeMutationInput(deviceTypeId, request))]).items[0] }; } catch (error: unknown) { this.translateDeviceTypeMutationError(error); } }
  @Post('configuration/catalogs/device-types/:deviceTypeId/deactivate')
  @Header('Cache-Control', 'private, no-store')
  async deactivateRepairDeviceType(@Headers() headers: RepairRequestHeaders, @Param('deviceTypeId') deviceTypeId: string, @Body() request: unknown) { try { return { item: adminDeviceTypeResponse([await this.operations.deactivateRepairDeviceType(repairProtectedRequestEvidence(headers), deviceTypeMutationInput(deviceTypeId, request))]).items[0] }; } catch (error: unknown) { this.translateDeviceTypeMutationError(error); } }
  @Post('configuration/catalogs/device-types/:deviceTypeId/reactivate')
  @Header('Cache-Control', 'private, no-store')
  async reactivateRepairDeviceType(@Headers() headers: RepairRequestHeaders, @Param('deviceTypeId') deviceTypeId: string, @Body() request: unknown) { try { return { item: adminDeviceTypeResponse([await this.operations.reactivateRepairDeviceType(repairProtectedRequestEvidence(headers), deviceTypeMutationInput(deviceTypeId, request))]).items[0] }; } catch (error: unknown) { this.translateDeviceTypeMutationError(error); } }
  @Post('configuration/catalogs/device-types/pending/:pendingDeviceTypeValueId/resolve')
  @Header('Cache-Control', 'private, no-store')
  async resolvePendingRepairDeviceType(@Headers() headers: RepairRequestHeaders, @Param('pendingDeviceTypeValueId') pendingDeviceTypeValueId: string, @Body() request: unknown) { try { return { item: pendingDeviceTypeResponse([await this.operations.resolvePendingRepairDeviceType(repairProtectedRequestEvidence(headers), pendingDeviceTypeMutationInput(pendingDeviceTypeValueId, request))]).items[0] }; } catch (error: unknown) { this.translateDeviceTypeMutationError(error); } }

  @Get('models')
  @Header('Cache-Control', 'private, no-store')
  async getOperationalRepairModels(@Headers() headers: RepairRequestHeaders, @Query('brandId') brandId: string | undefined, @Query('q') query: string | undefined) {
    try { return operationalModelResponse(await this.operations.listOperationalRepairModels(repairProtectedRequestEvidence(headers), brandId, query)); }
    catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof RepairModelInputError) throw new BadRequestException({ code: 'REPAIR_MODEL_INVALID', parameter: error.parameter });
      throw new ServiceUnavailableException({ code: 'REPAIR_MODELS_READ_FAILED' });
    }
  }

  @Get('configuration/catalogs/brands')
  @Header('Cache-Control', 'private, no-store')
  async getAdminRepairBrands(@Headers() headers: RepairRequestHeaders) {
    try { return adminBrandResponse(await this.operations.listAdminRepairBrands(repairProtectedRequestEvidence(headers))); }
    catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_BRANDS_READ_FAILED' }); }
  }

  @Get('configuration/catalogs/brands/pending')
  @Header('Cache-Control', 'private, no-store')
  async getPendingRepairBrands(@Headers() headers: RepairRequestHeaders) {
    try { return pendingBrandResponse(await this.operations.listPendingRepairBrands(repairProtectedRequestEvidence(headers))); }
    catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_BRANDS_READ_FAILED' }); }
  }

  @Post('configuration/catalogs/brands')
  @Header('Cache-Control', 'private, no-store')
  async createRepairBrand(@Headers() headers: RepairRequestHeaders, @Body() request: unknown) {
    try { return { item: adminBrandResponse([await this.operations.createRepairBrand(repairProtectedRequestEvidence(headers), request)]).items[0] }; }
    catch (error: unknown) { this.translateBrandMutationError(error); }
  }

  @Put('configuration/catalogs/brands/:brandId')
  @Header('Cache-Control', 'private, no-store')
  async renameRepairBrand(@Headers() headers: RepairRequestHeaders, @Param('brandId') brandId: string, @Body() request: unknown) {
    try { return { item: adminBrandResponse([await this.operations.renameRepairBrand(repairProtectedRequestEvidence(headers), brandMutationInput(brandId, request))]).items[0] }; }
    catch (error: unknown) { this.translateBrandMutationError(error); }
  }

  @Post('configuration/catalogs/brands/:brandId/deactivate')
  @Header('Cache-Control', 'private, no-store')
  async deactivateRepairBrand(@Headers() headers: RepairRequestHeaders, @Param('brandId') brandId: string, @Body() request: unknown) {
    try { return { item: adminBrandResponse([await this.operations.deactivateRepairBrand(repairProtectedRequestEvidence(headers), brandMutationInput(brandId, request))]).items[0] }; }
    catch (error: unknown) { this.translateBrandMutationError(error); }
  }

  @Post('configuration/catalogs/brands/:brandId/reactivate')
  @Header('Cache-Control', 'private, no-store')
  async reactivateRepairBrand(@Headers() headers: RepairRequestHeaders, @Param('brandId') brandId: string, @Body() request: unknown) {
    try { return { item: adminBrandResponse([await this.operations.reactivateRepairBrand(repairProtectedRequestEvidence(headers), brandMutationInput(brandId, request))]).items[0] }; }
    catch (error: unknown) { this.translateBrandMutationError(error); }
  }

  @Post('configuration/catalogs/brands/pending/:pendingBrandValueId/resolve')
  @Header('Cache-Control', 'private, no-store')
  async resolvePendingRepairBrand(@Headers() headers: RepairRequestHeaders, @Param('pendingBrandValueId') pendingBrandValueId: string, @Body() request: unknown) {
    try { return { item: pendingBrandResponse([await this.operations.resolvePendingRepairBrand(repairProtectedRequestEvidence(headers), pendingBrandMutationInput(pendingBrandValueId, request))]).items[0] }; }
    catch (error: unknown) { this.translateBrandMutationError(error); }
  }

  @Get('configuration/catalogs/models')
  @Header('Cache-Control', 'private, no-store')
  async getAdminRepairModels(@Headers() headers: RepairRequestHeaders, @Query('brandId') brandId: string | undefined) {
    try { return adminModelResponse(await this.operations.listAdminRepairModels(repairProtectedRequestEvidence(headers), brandId)); }
    catch (error: unknown) { translateAuthorizationError(error); if (error instanceof RepairModelInputError) throw new BadRequestException({ code: 'REPAIR_MODEL_INVALID', parameter: error.parameter }); throw new ServiceUnavailableException({ code: 'REPAIR_MODELS_READ_FAILED' }); }
  }

  @Get('configuration/catalogs/models/pending')
  @Header('Cache-Control', 'private, no-store')
  async getPendingRepairModels(@Headers() headers: RepairRequestHeaders, @Query('brandId') brandId: string | undefined) {
    try { return pendingModelResponse(await this.operations.listPendingRepairModels(repairProtectedRequestEvidence(headers), brandId)); }
    catch (error: unknown) { translateAuthorizationError(error); if (error instanceof RepairModelInputError) throw new BadRequestException({ code: 'REPAIR_MODEL_INVALID', parameter: error.parameter }); throw new ServiceUnavailableException({ code: 'REPAIR_MODELS_READ_FAILED' }); }
  }

  @Post('configuration/catalogs/models')
  @Header('Cache-Control', 'private, no-store')
  async createRepairModel(@Headers() headers: RepairRequestHeaders, @Body() request: unknown) {
    try { return { item: adminModelResponse([await this.operations.createRepairModel(repairProtectedRequestEvidence(headers), request)]).items[0] }; }
    catch (error: unknown) { this.translateModelMutationError(error); }
  }

  @Put('configuration/catalogs/models/:modelId')
  @Header('Cache-Control', 'private, no-store')
  async renameRepairModel(@Headers() headers: RepairRequestHeaders, @Param('modelId') modelId: string, @Body() request: unknown) {
    try { return { item: adminModelResponse([await this.operations.renameRepairModel(repairProtectedRequestEvidence(headers), modelMutationInput(modelId, request))]).items[0] }; }
    catch (error: unknown) { this.translateModelMutationError(error); }
  }

  @Post('configuration/catalogs/models/:modelId/deactivate')
  @Header('Cache-Control', 'private, no-store')
  async deactivateRepairModel(@Headers() headers: RepairRequestHeaders, @Param('modelId') modelId: string, @Body() request: unknown) {
    try { return { item: adminModelResponse([await this.operations.deactivateRepairModel(repairProtectedRequestEvidence(headers), modelMutationInput(modelId, request))]).items[0] }; }
    catch (error: unknown) { this.translateModelMutationError(error); }
  }

  @Post('configuration/catalogs/models/:modelId/reactivate')
  @Header('Cache-Control', 'private, no-store')
  async reactivateRepairModel(@Headers() headers: RepairRequestHeaders, @Param('modelId') modelId: string, @Body() request: unknown) {
    try { return { item: adminModelResponse([await this.operations.reactivateRepairModel(repairProtectedRequestEvidence(headers), modelMutationInput(modelId, request))]).items[0] }; }
    catch (error: unknown) { this.translateModelMutationError(error); }
  }

  @Post('configuration/catalogs/models/pending/:pendingModelValueId/resolve')
  @Header('Cache-Control', 'private, no-store')
  async resolvePendingRepairModel(@Headers() headers: RepairRequestHeaders, @Param('pendingModelValueId') pendingModelValueId: string, @Body() request: unknown) {
    try { return { item: pendingModelResponse([await this.operations.resolvePendingRepairModel(repairProtectedRequestEvidence(headers), pendingModelMutationInput(pendingModelValueId, request))]).items[0] }; }
    catch (error: unknown) { this.translateModelMutationError(error); }
  }

  @Get('configuration/catalogs/risks')
  @Header('Cache-Control', 'private, no-store')
  async getAdminRepairRisks(@Headers() headers: RepairRequestHeaders) {
    try {
      return adminRiskResponse(await this.operations.listAdminRepairRisks(repairProtectedRequestEvidence(headers)));
    } catch (error: unknown) {
      translateAuthorizationError(error);
      throw new ServiceUnavailableException({ code: 'REPAIR_RISKS_READ_FAILED' });
    }
  }

  @Post('configuration/catalogs/risks')
  @Header('Cache-Control', 'private, no-store')
  async createRepairRisk(@Headers() headers: RepairRequestHeaders, @Body() request: unknown) {
    try {
      return { item: (await adminRiskResponse([await this.operations.createRepairRisk(repairProtectedRequestEvidence(headers), request)])).items[0] };
    } catch (error: unknown) {
      this.translateRiskMutationError(error);
    }
  }

  @Put('configuration/catalogs/risks/:riskId')
  @Header('Cache-Control', 'private, no-store')
  async renameRepairRisk(@Headers() headers: RepairRequestHeaders, @Param('riskId') riskId: string, @Body() request: unknown) {
    try {
      return { item: (await adminRiskResponse([await this.operations.renameRepairRisk(repairProtectedRequestEvidence(headers), riskMutationInput(riskId, request))])).items[0] };
    } catch (error: unknown) {
      this.translateRiskMutationError(error);
    }
  }

  @Post('configuration/catalogs/risks/:riskId/deactivate')
  @Header('Cache-Control', 'private, no-store')
  async deactivateRepairRisk(@Headers() headers: RepairRequestHeaders, @Param('riskId') riskId: string, @Body() request: unknown) {
    try {
      return { item: (await adminRiskResponse([await this.operations.deactivateRepairRisk(repairProtectedRequestEvidence(headers), riskMutationInput(riskId, request))])).items[0] };
    } catch (error: unknown) {
      this.translateRiskMutationError(error);
    }
  }

  @Post('configuration/catalogs/risks/:riskId/reactivate')
  @Header('Cache-Control', 'private, no-store')
  async reactivateRepairRisk(@Headers() headers: RepairRequestHeaders, @Param('riskId') riskId: string, @Body() request: unknown) {
    try {
      return { item: (await adminRiskResponse([await this.operations.reactivateRepairRisk(repairProtectedRequestEvidence(headers), riskMutationInput(riskId, request))])).items[0] };
    } catch (error: unknown) {
      this.translateRiskMutationError(error);
    }
  }

  @Get('configuration/catalogs/problem-categories')
  @Header('Cache-Control', 'private, no-store')
  async getAdminProblemCategories(@Headers() headers: RepairRequestHeaders) {
    try { return problemCategoryResponse(await this.operations.listAdminProblemCategories(repairProtectedRequestEvidence(headers))); }
    catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_PROBLEM_CATEGORIES_READ_FAILED' }); }
  }

  @Get('configuration/catalogs/problem-categories/pending')
  @Header('Cache-Control', 'private, no-store')
  async getPendingProblems(@Headers() headers: RepairRequestHeaders) {
    try { return pendingProblemResponse(await this.operations.listPendingProblems(repairProtectedRequestEvidence(headers))); }
    catch (error: unknown) { translateAuthorizationError(error); throw new ServiceUnavailableException({ code: 'REPAIR_PROBLEM_CATEGORIES_READ_FAILED' }); }
  }

  @Post('configuration/catalogs/problem-categories/pending/:pendingProblemValueId/resolve')
  @Header('Cache-Control', 'private, no-store')
  async resolvePendingProblem(@Headers() headers: RepairRequestHeaders, @Param('pendingProblemValueId') pendingProblemValueId: string, @Body() request: unknown) {
    try { return { item: pendingProblemResponse([await this.operations.resolvePendingProblem(repairProtectedRequestEvidence(headers), pendingProblemMutationInput(pendingProblemValueId, request))]).items[0] }; }
    catch (error: unknown) { this.translateProblemCategoryMutationError(error); }
  }

  @Post('configuration/catalogs/problem-categories')
  @Header('Cache-Control', 'private, no-store')
  async createProblemCategory(@Headers() headers: RepairRequestHeaders, @Body() request: unknown) {
    try { return { item: problemCategoryResponse([await this.operations.createProblemCategory(repairProtectedRequestEvidence(headers), request)]).items[0] }; }
    catch (error: unknown) { this.translateProblemCategoryMutationError(error); }
  }

  @Put('configuration/catalogs/problem-categories/:categoryId')
  @Header('Cache-Control', 'private, no-store')
  async renameProblemCategory(@Headers() headers: RepairRequestHeaders, @Param('categoryId') categoryId: string, @Body() request: unknown) {
    try { return { item: problemCategoryResponse([await this.operations.renameProblemCategory(repairProtectedRequestEvidence(headers), problemCategoryMutationInput(categoryId, request))]).items[0] }; }
    catch (error: unknown) { this.translateProblemCategoryMutationError(error); }
  }

  @Post('configuration/catalogs/problem-categories/:categoryId/deactivate')
  @Header('Cache-Control', 'private, no-store')
  async deactivateProblemCategory(@Headers() headers: RepairRequestHeaders, @Param('categoryId') categoryId: string, @Body() request: unknown) {
    try { return { item: problemCategoryResponse([await this.operations.deactivateProblemCategory(repairProtectedRequestEvidence(headers), problemCategoryMutationInput(categoryId, request))]).items[0] }; }
    catch (error: unknown) { this.translateProblemCategoryMutationError(error); }
  }

  @Post('configuration/catalogs/problem-categories/:categoryId/reactivate')
  @Header('Cache-Control', 'private, no-store')
  async reactivateProblemCategory(@Headers() headers: RepairRequestHeaders, @Param('categoryId') categoryId: string, @Body() request: unknown) {
    try { return { item: problemCategoryResponse([await this.operations.reactivateProblemCategory(repairProtectedRequestEvidence(headers), problemCategoryMutationInput(categoryId, request))]).items[0] }; }
    catch (error: unknown) { this.translateProblemCategoryMutationError(error); }
  }

  @Delete('configuration/catalogs/problem-categories/:categoryId')
  @Header('Cache-Control', 'private, no-store')
  async deleteProblemCategory(@Headers() headers: RepairRequestHeaders, @Param('categoryId') categoryId: string, @Body() request: unknown) {
    try { return { item: await this.operations.deleteProblemCategory(repairProtectedRequestEvidence(headers), problemCategoryMutationInput(categoryId, request)) }; }
    catch (error: unknown) { this.translateProblemCategoryMutationError(error); }
  }

  @Get('configuration/new-repair-policy')
  @Header('Cache-Control', 'private, no-store')
  async getAdminNewRepairPolicy(@Headers() headers: RepairRequestHeaders) {
    try {
      return await this.operations.readAdminNewRepairPolicy(repairProtectedRequestEvidence(headers));
    } catch (error: unknown) {
      translateAuthorizationError(error);
      throw new ServiceUnavailableException({ code: 'NEW_REPAIR_POLICY_READ_FAILED' });
    }
  }

  @Put('configuration/new-repair-policy')
  @Header('Cache-Control', 'private, no-store')
  async updateNewRepairPolicy(@Headers() headers: RepairRequestHeaders, @Body() request: unknown) {
    try {
      return await this.operations.updateNewRepairPolicy(repairProtectedRequestEvidence(headers), request);
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof NewRepairPolicyInputError) throw new BadRequestException({ code: 'NEW_REPAIR_POLICY_INVALID', parameter: error.parameter });
      if (error instanceof NewRepairPolicyConcurrencyConflictError) throw new ConflictException({ code: 'NEW_REPAIR_POLICY_VERSION_CONFLICT' });
      if (error instanceof NewRepairPolicyAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
      throw new ServiceUnavailableException({ code: 'NEW_REPAIR_POLICY_UPDATE_FAILED' });
    }
  }

  @Post('configuration/new-repair-policy/reset')
  @Header('Cache-Control', 'private, no-store')
  async resetNewRepairPolicy(@Headers() headers: RepairRequestHeaders, @Body() request: unknown) {
    try {
      return await this.operations.resetNewRepairPolicy(repairProtectedRequestEvidence(headers), request);
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof NewRepairPolicyInputError) throw new BadRequestException({ code: 'NEW_REPAIR_POLICY_INVALID', parameter: error.parameter });
      if (error instanceof NewRepairPolicyConcurrencyConflictError) throw new ConflictException({ code: 'NEW_REPAIR_POLICY_VERSION_CONFLICT' });
      if (error instanceof NewRepairPolicyAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
      throw new ServiceUnavailableException({ code: 'NEW_REPAIR_POLICY_RESET_FAILED' });
    }
  }

  @Get('customer-lookup')
  @Header('Cache-Control', 'private, no-store')
  async searchCustomers(
    @Headers() headers: RepairRequestHeaders,
    @Query('q') query: string | undefined,
  ) {
    try {
      const items = await this.operations.searchCustomers(repairProtectedRequestEvidence(headers), query);
      return { items: items.map((customer) => ({
        id: customer.customerId,
        givenName: customer.givenName,
        familyName: customer.familyName,
        name: customer.displayName,
        contactPhone: customer.contactPhone,
        contactPhones: customer.contactPhones,
        matchedPhone: customer.matchedPhone,
      })) };
    } catch (error: unknown) {
      translateAuthorizationError(error);
      throw new BadRequestException({ code: 'CUSTOMER_SEARCH_INVALID' });
    }
  }

  @Get('previous-repair-lookup')
  @Header('Cache-Control', 'private, no-store')
  async searchPreviousRepairs(
    @Headers() headers: RepairRequestHeaders,
    @Query('q') query: string | undefined,
  ) {
    try {
      const page = await this.operations.searchPreviousRepairs(repairProtectedRequestEvidence(headers), query);
      return { items: response(page).items };
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof ListRepairsQueryError) throw new BadRequestException({ code: 'PREVIOUS_REPAIR_SEARCH_INVALID', parameter: error.parameter });
      if (error instanceof Error && error.name.includes('Database')) throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      throw new InternalServerErrorException({ code: 'PREVIOUS_REPAIR_SEARCH_FAILED' });
    }
  }

  @Post(':repairId/technician-assignment')
  @Header('Cache-Control', 'private, no-store')
  assignTechnician(): never {
    return this.rejectUncataloguedWrite();
  }

  @Post(':repairId/technician-reassignment')
  @Header('Cache-Control', 'private, no-store')
  reassignTechnician(): never {
    return this.rejectUncataloguedWrite();
  }

  @Post(':repairId/technician-unassignment')
  @Header('Cache-Control', 'private, no-store')
  unassignTechnician(): never {
    return this.rejectUncataloguedWrite();
  }

  @Post(':repairId/workflow/start-diagnosis')
  @Header('Cache-Control', 'private, no-store')
  startDiagnosis(): never {
    return this.rejectUncataloguedWrite();
  }

  @Post(':repairId/location/move-to-workshop')
  @Header('Cache-Control', 'private, no-store')
  moveToWorkshop(): never {
    return this.rejectUncataloguedWrite();
  }

  private rejectUncataloguedWrite(): never {
    try {
      return this.operations.rejectUncataloguedWrite();
    } catch (error: unknown) {
      translateAuthorizationError(error);
      throw new ForbiddenException({ code: 'ACCESS_DENIED' });
    }
  }

  private translateRiskMutationError(error: unknown): never {
    translateAuthorizationError(error);
    if (error instanceof RepairRiskInputError) throw new BadRequestException({ code: 'REPAIR_RISK_INVALID', parameter: error.parameter });
    if (error instanceof RepairRiskDuplicateError) throw new ConflictException({ code: 'REPAIR_RISK_DUPLICATE' });
    if (error instanceof RepairRiskConcurrencyConflictError) throw new ConflictException({ code: 'REPAIR_RISK_VERSION_CONFLICT' });
    if (error instanceof RepairRiskNotFoundError) throw new NotFoundException({ code: 'REPAIR_RISK_NOT_FOUND' });
    if (error instanceof RepairRiskAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
    if (error instanceof Error && error.name.includes('Database')) throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
    throw new InternalServerErrorException({ code: 'REPAIR_RISK_WRITE_FAILED' });
  }

  private translateProblemCategoryMutationError(error: unknown): never {
    translateAuthorizationError(error);
    if (error instanceof RepairProblemCategoryInputError) throw new BadRequestException({ code: 'REPAIR_PROBLEM_CATEGORY_INVALID', parameter: error.parameter });
    if (error instanceof RepairProblemCategoryDuplicateError) throw new ConflictException({ code: 'REPAIR_PROBLEM_CATEGORY_DUPLICATE' });
    if (error instanceof RepairProblemCategoryConcurrencyConflictError) throw new ConflictException({ code: 'REPAIR_PROBLEM_CATEGORY_VERSION_CONFLICT' });
    if (error instanceof RepairProblemCategoryDeleteNotAllowedError) throw new ConflictException({ code: 'REPAIR_PROBLEM_CATEGORY_DELETE_NOT_ALLOWED', reason: error.reason });
    if (error instanceof RepairProblemCategoryNotFoundError) throw new NotFoundException({ code: 'REPAIR_PROBLEM_CATEGORY_NOT_FOUND' });
    if (error instanceof RepairProblemPendingNotFoundError) throw new NotFoundException({ code: 'REPAIR_PROBLEM_PENDING_NOT_FOUND' });
    if (error instanceof RepairProblemCategoryAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
    if (error instanceof Error && error.name.includes('Database')) throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
    throw new InternalServerErrorException({ code: 'REPAIR_PROBLEM_CATEGORY_WRITE_FAILED' });
  }

  private translateProblemClassificationMutationError(error: unknown): never {
    translateAuthorizationError(error);
    if (error instanceof RepairProblemClassificationInputError) throw new BadRequestException({ code: 'REPAIR_PROBLEM_CLASSIFICATION_INVALID', parameter: error.parameter });
    if (error instanceof RepairProblemClassificationConflictError) throw new ConflictException({ code: 'REPAIR_PROBLEM_CLASSIFICATION_CONFLICT' });
    if (error instanceof RepairProblemClassificationNotFoundError) throw new NotFoundException({ code: 'REPAIR_OR_PROBLEM_CATEGORY_NOT_FOUND' });
    if (error instanceof RepairProblemClassificationAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
    if (error instanceof Error && error.name.includes('Database')) throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
    throw new InternalServerErrorException({ code: 'REPAIR_PROBLEM_CLASSIFICATION_WRITE_FAILED' });
  }

  private translateBrandMutationError(error: unknown): never {
    translateAuthorizationError(error);
    if (error instanceof RepairBrandInputError) throw new BadRequestException({ code: 'REPAIR_BRAND_INVALID', parameter: error.parameter });
    if (error instanceof RepairBrandDuplicateError) throw new ConflictException({ code: 'REPAIR_BRAND_DUPLICATE' });
    if (error instanceof RepairBrandConcurrencyConflictError) throw new ConflictException({ code: 'REPAIR_BRAND_VERSION_CONFLICT' });
    if (error instanceof RepairBrandNotFoundError) throw new NotFoundException({ code: 'REPAIR_BRAND_NOT_FOUND' });
    if (error instanceof RepairBrandPendingNotFoundError) throw new NotFoundException({ code: 'REPAIR_BRAND_PENDING_NOT_FOUND' });
    if (error instanceof RepairBrandAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
    if (error instanceof Error && error.name.includes('Database')) throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
    throw new InternalServerErrorException({ code: 'REPAIR_BRAND_WRITE_FAILED' });
  }

  private translateDeviceTypeMutationError(error: unknown): never {
    translateAuthorizationError(error);
    if (error instanceof RepairDeviceTypeInputError) throw new BadRequestException({ code: 'REPAIR_DEVICE_TYPE_INVALID', parameter: error.parameter });
    if (error instanceof RepairDeviceTypeDuplicateError) throw new ConflictException({ code: 'REPAIR_DEVICE_TYPE_DUPLICATE' });
    if (error instanceof RepairDeviceTypeConcurrencyConflictError) throw new ConflictException({ code: 'REPAIR_DEVICE_TYPE_VERSION_CONFLICT' });
    if (error instanceof RepairDeviceTypeNotFoundError) throw new NotFoundException({ code: 'REPAIR_DEVICE_TYPE_NOT_FOUND' });
    if (error instanceof RepairDeviceTypePendingNotFoundError) throw new NotFoundException({ code: 'REPAIR_DEVICE_TYPE_PENDING_NOT_FOUND' });
    if (error instanceof RepairDeviceTypeAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
    if (error instanceof Error && error.name.includes('Database')) throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
    throw new InternalServerErrorException({ code: 'REPAIR_DEVICE_TYPE_WRITE_FAILED' });
  }

  private translateModelMutationError(error: unknown): never {
    translateAuthorizationError(error);
    if (error instanceof RepairModelInputError) throw new BadRequestException({ code: 'REPAIR_MODEL_INVALID', parameter: error.parameter });
    if (error instanceof RepairModelDuplicateError) throw new ConflictException({ code: 'REPAIR_MODEL_DUPLICATE' });
    if (error instanceof RepairModelConcurrencyConflictError) throw new ConflictException({ code: 'REPAIR_MODEL_VERSION_CONFLICT' });
    if (error instanceof RepairModelNotFoundError) throw new NotFoundException({ code: 'REPAIR_MODEL_NOT_FOUND' });
    if (error instanceof RepairModelPendingNotFoundError) throw new NotFoundException({ code: 'REPAIR_MODEL_PENDING_NOT_FOUND' });
    if (error instanceof RepairModelAuthorizationChangedError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
    if (error instanceof Error && error.name.includes('Database')) throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
    throw new InternalServerErrorException({ code: 'REPAIR_MODEL_WRITE_FAILED' });
  }

  @Post(':repairId/notes')
  @Header('Cache-Control', 'private, no-store')
  async addOperationalNote(
    @Headers() headers: RepairRequestHeaders,
    @Param('repairId') repairId: string,
    @Body() request: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.operations.addRepairOperationalNote(
        repairProtectedRequestEvidence(headers),
        { repairId, request },
      );
      if (!result.attribution) {
        throw new Error('Confirmed operational note is missing attribution.');
      }
      response.setHeader('X-Correlation-ID', result.attribution.correlationId);
      return operationalNoteResponse(result);
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof AddRepairOperationalNoteInputError) {
        throw new BadRequestException({
          code: error.parameter === 'repairId' ? 'REPAIR_ID_INVALID' : 'REPAIR_NOTE_INVALID',
          parameter: error.parameter,
        });
      }
      if (error instanceof RepairOperationalNoteRepairNotFoundError) {
        throw new NotFoundException({ code: 'REPAIR_NOT_FOUND' });
      }
      if (error instanceof AddRepairOperationalNoteConflictError) {
        throw new ConflictException({ code: 'REPAIR_NOTE_IDEMPOTENCY_CONFLICT' });
      }
      if (error instanceof AddRepairOperationalNoteAuthorizationError) {
        throw new ForbiddenException({ code: 'ACCESS_DENIED' });
      }
      if (error instanceof Error && error.name.includes('Database')) {
        throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      }
      throw new InternalServerErrorException({ code: 'REPAIR_NOTE_WRITE_FAILED' });
    }
  }

  @Post(':repairId/equipment-correction')
  @Header('Cache-Control', 'private, no-store')
  async correctEquipment(
    @Headers() headers: RepairRequestHeaders,
    @Param('repairId') repairId: string,
    @Body() request: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.operations.correctRepairEquipment(
        repairProtectedRequestEvidence(headers),
        { repairId, request },
      );
      response.setHeader('X-Correlation-ID', result.correlationId);
      return {
        item: {
          repairId: result.repairId,
          equipmentVersion: result.equipmentVersion,
          brand: result.deviceBrand,
          canonicalBrandId: result.canonicalBrandId,
          model: result.deviceModel,
          canonicalModelId: result.canonicalModelId,
          timeline: {
            id: result.timelineItem.id,
            type: result.timelineItem.type,
            occurredAt: result.timelineItem.occurredAt,
            actor: { id: result.timelineItem.actorId, displayName: result.timelineItem.actorDisplayName },
            title: result.timelineItem.title,
            body: result.timelineItem.body,
            source: result.timelineItem.source,
          },
        },
      };
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof CorrectRepairEquipmentInputError) throw new BadRequestException({ code: 'REPAIR_EQUIPMENT_CORRECTION_INVALID', parameter: error.parameter });
      if (error instanceof RepairEquipmentCorrectionNotFoundError) throw new NotFoundException({ code: 'REPAIR_NOT_FOUND' });
      if (error instanceof CorrectRepairEquipmentConflictError) throw new ConflictException({ code: error.kind === 'version' ? 'REPAIR_EQUIPMENT_VERSION_CONFLICT' : 'REPAIR_EQUIPMENT_IDEMPOTENCY_CONFLICT' });
      if (error instanceof CorrectRepairEquipmentAuthorizationError) throw new ForbiddenException({ code: 'ACCESS_DENIED' });
      if (error instanceof Error && error.name.includes('Database')) throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      throw new InternalServerErrorException({ code: 'REPAIR_EQUIPMENT_CORRECTION_FAILED' });
    }
  }

  @Post(':repairId/problem-classifications/:categoryId')
  @Header('Cache-Control', 'private, no-store')
  async addProblemClassification(@Headers() headers: RepairRequestHeaders, @Param('repairId') repairId: string, @Param('categoryId') categoryId: string) {
    try { return { item: await this.operations.addRepairProblemClassification(repairProtectedRequestEvidence(headers), repairId, categoryId) }; }
    catch (error: unknown) { this.translateProblemClassificationMutationError(error); }
  }

  @Post(':repairId/problem-classifications/:categoryId/remove')
  @Header('Cache-Control', 'private, no-store')
  async removeProblemClassification(@Headers() headers: RepairRequestHeaders, @Param('repairId') repairId: string, @Param('categoryId') categoryId: string) {
    try { return { item: await this.operations.removeRepairProblemClassification(repairProtectedRequestEvidence(headers), repairId, categoryId) }; }
    catch (error: unknown) { this.translateProblemClassificationMutationError(error); }
  }

  @Get(':repairId/evidence/:evidenceId/content')
  @Header('Cache-Control', 'private, no-store')
  async getEvidenceContent(
    @Headers() headers: RepairRequestHeaders,
    @Param('repairId') repairId: string,
    @Param('evidenceId') evidenceId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.operations.getRepairEvidenceContent(
        repairProtectedRequestEvidence(headers),
        { repairId, evidenceId },
      );
      response.set({
        'Cache-Control': 'private, no-store',
        'Content-Length': String(result.sizeBytes),
        'Content-Type': result.mimeType,
        'X-Content-Type-Options': 'nosniff',
      });
      return new StreamableFile(Buffer.from(result.content));
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof GetRepairEvidenceContentInputError) {
        throw new BadRequestException({ code: 'REPAIR_EVIDENCE_ID_INVALID' });
      }
      if (error instanceof RepairEvidenceContentNotFoundError) {
        throw new NotFoundException({ code: 'REPAIR_EVIDENCE_NOT_FOUND' });
      }
      if (error instanceof Error && error.name.includes('Database')) {
        throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      }
      throw new InternalServerErrorException({ code: 'REPAIR_EVIDENCE_READ_FAILED' });
    }
  }

  @Get(':id')
  @Header('Cache-Control', 'private, no-store')
  async getDetail(
    @Headers() headers: RepairRequestHeaders,
    @Param('id') id: string,
  ) {
    try {
      return detailResponse(await this.operations.getRepairDetail(
        repairProtectedRequestEvidence(headers),
        { repairId: id },
      ));
    } catch (error: unknown) {
      translateAuthorizationError(error);
      if (error instanceof GetRepairDetailInputError) {
        throw new BadRequestException({ code: 'REPAIR_ID_INVALID' });
      }
      if (error instanceof RepairDetailNotFoundError) {
        throw new NotFoundException({ code: 'REPAIR_NOT_FOUND' });
      }
      if (error instanceof Error && error.name.includes('Database')) {
        throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      }
      throw new InternalServerErrorException({ code: 'REPAIR_READ_FAILED' });
    }
  }
}
