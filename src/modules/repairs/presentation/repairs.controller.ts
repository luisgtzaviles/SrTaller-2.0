import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  ServiceUnavailableException,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';

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
  GetRepairEvidenceContentUseCase,
  RepairEvidenceContentNotFoundError,
} from '../application/use-cases/get-repair-evidence-content.use-case.js';
import {
  AddRepairOperationalNoteInputError,
  AddRepairOperationalNoteUseCase,
  RepairOperationalNoteRepairNotFoundError,
} from '../application/use-cases/add-repair-operational-note.use-case.js';

type RepairQuery = Readonly<Record<string, string | string[] | undefined>>;

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
      actor: { displayName: item.actorDisplayName },
      title: item.title,
      body: item.body,
      source: item.source,
    },
  };
}

@Controller('api/repairs')
export class RepairsController {
  constructor(
    private readonly listRepairs: ListRepairsUseCase,
    private readonly getRepairDetail: GetRepairDetailUseCase,
    private readonly getRepairEvidenceContent: GetRepairEvidenceContentUseCase,
    private readonly addRepairOperationalNote: AddRepairOperationalNoteUseCase,
  ) {}

  @Get()
  async getWorklist(@Query() query: RepairQuery) {
    try {
      return response(await this.listRepairs.execute(query));
    } catch (error: unknown) {
      if (error instanceof ListRepairsQueryError) {
        throw new BadRequestException({
          code: 'REPAIRS_QUERY_INVALID',
          parameter: error.parameter,
        });
      }
      if (error instanceof Error && error.name === 'LocalRepairContextError') {
        throw new ServiceUnavailableException({ code: 'REPAIRS_CONTEXT_UNAVAILABLE' });
      }
      if (error instanceof Error && error.name.includes('Database')) {
        throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      }
      throw new InternalServerErrorException({ code: 'REPAIRS_READ_FAILED' });
    }
  }

  @Post(':repairId/notes')
  async addOperationalNote(
    @Param('repairId') repairId: string,
    @Body() request: unknown,
  ) {
    try {
      return operationalNoteResponse(await this.addRepairOperationalNote.execute({
        repairId,
        request,
      }));
    } catch (error: unknown) {
      if (error instanceof AddRepairOperationalNoteInputError) {
        throw new BadRequestException({
          code: error.parameter === 'repairId' ? 'REPAIR_ID_INVALID' : 'REPAIR_NOTE_INVALID',
          parameter: error.parameter,
        });
      }
      if (error instanceof RepairOperationalNoteRepairNotFoundError) {
        throw new NotFoundException({ code: 'REPAIR_NOT_FOUND' });
      }
      if (error instanceof Error && error.name === 'LocalRepairContextError') {
        throw new ServiceUnavailableException({ code: 'REPAIRS_CONTEXT_UNAVAILABLE' });
      }
      if (error instanceof Error && error.name.includes('Database')) {
        throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      }
      throw new InternalServerErrorException({ code: 'REPAIR_NOTE_WRITE_FAILED' });
    }
  }

  @Get(':repairId/evidence/:evidenceId/content')
  async getEvidenceContent(
    @Param('repairId') repairId: string,
    @Param('evidenceId') evidenceId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.getRepairEvidenceContent.execute({ repairId, evidenceId });
      response.set({
        'Cache-Control': 'private, no-store',
        'Content-Length': String(result.sizeBytes),
        'Content-Type': result.mimeType,
        'X-Content-Type-Options': 'nosniff',
      });
      return new StreamableFile(Buffer.from(result.content));
    } catch (error: unknown) {
      if (error instanceof GetRepairEvidenceContentInputError) {
        throw new BadRequestException({ code: 'REPAIR_EVIDENCE_ID_INVALID' });
      }
      if (error instanceof RepairEvidenceContentNotFoundError) {
        throw new NotFoundException({ code: 'REPAIR_EVIDENCE_NOT_FOUND' });
      }
      if (error instanceof Error && error.name === 'LocalRepairContextError') {
        throw new ServiceUnavailableException({ code: 'REPAIRS_CONTEXT_UNAVAILABLE' });
      }
      if (error instanceof Error && error.name.includes('Database')) {
        throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      }
      throw new InternalServerErrorException({ code: 'REPAIR_EVIDENCE_READ_FAILED' });
    }
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    try {
      return detailResponse(await this.getRepairDetail.execute({ repairId: id }));
    } catch (error: unknown) {
      if (error instanceof GetRepairDetailInputError) {
        throw new BadRequestException({ code: 'REPAIR_ID_INVALID' });
      }
      if (error instanceof RepairDetailNotFoundError) {
        throw new NotFoundException({ code: 'REPAIR_NOT_FOUND' });
      }
      if (error instanceof Error && error.name === 'LocalRepairContextError') {
        throw new ServiceUnavailableException({ code: 'REPAIRS_CONTEXT_UNAVAILABLE' });
      }
      if (error instanceof Error && error.name.includes('Database')) {
        throw new ServiceUnavailableException({ code: 'REPAIRS_DATABASE_UNAVAILABLE' });
      }
      throw new InternalServerErrorException({ code: 'REPAIR_READ_FAILED' });
    }
  }
}
