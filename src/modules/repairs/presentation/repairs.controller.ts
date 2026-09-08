import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
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
        brand: item.deviceBrand,
        model: item.deviceModel,
        label: `${item.deviceBrand} ${item.deviceModel}`.trim(),
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
      brand: item.deviceBrand,
      model: item.deviceModel,
      label: `${item.deviceBrand} ${item.deviceModel}`.trim(),
      color: item.deviceColor,
    },
    intake: {
      receivedAt: item.receivedAt,
      receivedBy: item.receivedById && item.receivedByDisplayName
        ? { id: item.receivedById, displayName: item.receivedByDisplayName }
        : null,
      reportedIssue: item.reportedIssue,
      customerNarrative: item.customerNarrative,
      physicalConditionSummary: item.physicalConditionSummary,
      documentedRiskSummary: item.documentedRiskSummary,
    },
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
