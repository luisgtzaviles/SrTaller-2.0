import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { PreviewContextView } from '../../index.js';
import { PreviewRuntimeService } from '../../../../preview-runtime.service.js';
import type { CreatePreviewRepairInput } from '../../domain/preview-repair.js';
import type {
  PreviewRepairDetail,
  PreviewRepairRecord,
} from '../../domain/preview-repair.js';
import { PreviewRepairDomainError } from '../../domain/preview-repair.js';

function publicError(code: string, message: string): Readonly<{
  error: Readonly<{ code: string; message: string }>;
}> {
  return Object.freeze({ error: Object.freeze({ code, message }) });
}

function objectBody(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new PreviewRepairDomainError('PREVIEW_REPAIR_INVALID');
  }
  return value as Readonly<Record<string, unknown>>;
}

function createInput(value: unknown): CreatePreviewRepairInput {
  const body = objectBody(value);
  return {
    customerName: body.customerName as string,
    customerPhone: body.customerPhone as string,
    deviceBrand: body.deviceBrand as string,
    deviceModel: body.deviceModel as string,
    deviceSerial: (body.deviceSerial ?? null) as string | null,
    deviceColor: (body.deviceColor ?? null) as string | null,
    reportedProblem: body.reportedProblem as string,
    physicalCondition: (body.physicalCondition ?? null) as string | null,
    notes: (body.notes ?? null) as string | null,
    estimatedPrice: (body.estimatedPrice ?? null) as number | null,
    depositAmount: body.depositAmount as number,
  };
}

@Controller('api/preview')
export class PreviewController {
  constructor(private readonly runtime: PreviewRuntimeService) {}

  @Get('context')
  async context(): Promise<PreviewContextView> {
    if (!this.runtime.enabled) {
      throw new NotFoundException();
    }
    const context = this.runtime.context;
    if (!context) {
      throw new ServiceUnavailableException({
        error: Object.freeze({
          code: 'PREVIEW_CONTEXT_UNAVAILABLE',
          message: 'Preview operational context is not available.',
        }),
      });
    }
    return context;
  }

  @Get('repairs')
  listRepairs(): Promise<readonly PreviewRepairRecord[]> {
    this.assertAvailable();
    return this.runtime.listRepairs();
  }

  @Get('repairs/:id')
  async repairDetail(@Param('id') id: string): Promise<PreviewRepairDetail> {
    this.assertAvailable();
    try {
      const repair = await this.runtime.repairDetail(id);
      if (!repair) {
        throw new NotFoundException(publicError(
          'PREVIEW_REPAIR_NOT_FOUND',
          'Preview repair was not found.',
        ));
      }
      return repair;
    } catch (error: unknown) {
      this.mapValidation(error);
      throw error;
    }
  }

  @Post('repairs')
  async createRepair(@Body() body: unknown): Promise<PreviewRepairDetail> {
    this.assertAvailable();
    try {
      return await this.runtime.createRepair(createInput(body));
    } catch (error: unknown) {
      this.mapValidation(error);
      throw error;
    }
  }

  @Patch('repairs/:id/status')
  async transitionStatus(
    @Param('id') id: string,
    @Body() value: unknown,
  ): Promise<PreviewRepairDetail> {
    this.assertAvailable();
    try {
      const body = objectBody(value);
      const result = await this.runtime.transitionRepairStatus(
        id,
        body.expectedRevision,
        body.status,
      );
      if (result.kind === 'updated') {
        return result.repair;
      }
      if (result.kind === 'not-found') {
        throw new NotFoundException(publicError(
          'PREVIEW_REPAIR_NOT_FOUND',
          'Preview repair was not found.',
        ));
      }
      throw new ConflictException(publicError(
        result.kind === 'revision-conflict'
          ? 'PREVIEW_REPAIR_REVISION_CONFLICT'
          : 'PREVIEW_REPAIR_STATUS_CONFLICT',
        result.kind === 'revision-conflict'
          ? 'Preview repair changed; reload before retrying.'
          : 'Requested preview repair status transition is not allowed.',
      ));
    } catch (error: unknown) {
      this.mapValidation(error);
      throw error;
    }
  }

  private assertAvailable(): void {
    if (!this.runtime.enabled) {
      throw new NotFoundException();
    }
    if (!this.runtime.context) {
      throw new ServiceUnavailableException(publicError(
        'PREVIEW_CONTEXT_UNAVAILABLE',
        'Preview operational context is not available.',
      ));
    }
  }

  private mapValidation(error: unknown): void {
    if (error instanceof PreviewRepairDomainError) {
      throw new BadRequestException(publicError(
        'PREVIEW_REPAIR_VALIDATION_FAILED',
        'Preview repair request is invalid.',
      ));
    }
  }
}
