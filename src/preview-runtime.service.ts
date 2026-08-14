import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';

import { parseDatabaseConfig } from './infrastructure/database/database-config.js';
import type { DatabaseConnection } from './infrastructure/database/database-connection.js';
import { createDatabaseConnection } from './infrastructure/database/database-connection.js';
import type { PreviewContextView } from './modules/preview/index.js';
import type { CreatePreviewRepairInput } from './modules/preview/domain/preview-repair.js';
import type {
  PreviewRepairDetail,
  PreviewRepairRecord,
  PreviewRepairStatus,
} from './modules/preview/domain/preview-repair.js';
import { PreviewRepairService } from './modules/preview/application/preview-repair.service.js';
import { createKyselyPreviewRepairRepository } from './modules/preview/infrastructure/persistence/kysely-preview-repair.repository.js';
import type { TrustedStationContext } from './modules/stations/index.js';
import { createStationsComposition } from './modules/stations/stations.module.js';
import { FakeStationRecognition } from './modules/stations/infrastructure/recognition/fake-station-recognition.js';
import { createKyselyBranchEligibilityCapability } from './modules/tenancy/infrastructure/persistence/kysely-branch-eligibility.js';
import type { PreviewEnabledConfig } from './preview-config.js';
import { loadPreviewConfig } from './preview-config.js';

function contextView(config: PreviewEnabledConfig): PreviewContextView {
  return Object.freeze({
    tenantName: config.tenantName,
    branchName: config.branchName,
    stationLabel: config.stationLabel,
    environment: 'DEV_PREVIEW' as const,
  });
}

@Injectable()
export class PreviewRuntimeService implements OnModuleInit, OnApplicationShutdown {
  readonly #config = loadPreviewConfig(process.env);
  #connection: DatabaseConnection | null = null;
  #context: PreviewContextView | null = null;
  #trustedStation: TrustedStationContext | null = null;
  #repairs: PreviewRepairService | null = null;

  get enabled(): boolean {
    return this.#config.enabled;
  }

  get context(): PreviewContextView | null {
    return this.#context;
  }

  get ready(): boolean {
    return this.#config.enabled &&
      this.#connection?.state === 'ready' &&
      this.#context !== null &&
      this.#trustedStation !== null &&
      this.#repairs !== null;
  }

  private operational(): Readonly<{
    service: PreviewRepairService;
    station: TrustedStationContext;
    actorLabel: string;
  }> {
    if (
      !this.#config.enabled ||
      !this.#repairs ||
      !this.#trustedStation
    ) {
      throw new Error('Preview runtime is not available.');
    }
    return Object.freeze({
      service: this.#repairs,
      station: this.#trustedStation,
      actorLabel: this.#config.actorLabel,
    });
  }

  createRepair(input: CreatePreviewRepairInput): Promise<PreviewRepairDetail> {
    const runtime = this.operational();
    return runtime.service.create(
      { station: runtime.station, actorLabel: runtime.actorLabel },
      input,
    );
  }

  listRepairs(): Promise<readonly PreviewRepairRecord[]> {
    const runtime = this.operational();
    return runtime.service.list(runtime.station);
  }

  repairDetail(repairId: unknown): Promise<PreviewRepairDetail | null> {
    const runtime = this.operational();
    return runtime.service.detail(runtime.station, repairId);
  }

  transitionRepairStatus(
    repairId: unknown,
    expectedRevision: unknown,
    status: unknown,
  ) {
    const runtime = this.operational();
    return runtime.service.transitionStatus(
      { station: runtime.station, actorLabel: runtime.actorLabel },
      repairId,
      expectedRevision,
      status,
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.#config.enabled) {
      return;
    }

    const connection = createDatabaseConnection(parseDatabaseConfig(process.env));
    try {
      await connection.verify();
      const recognition = new FakeStationRecognition([
        {
          opaque: this.#config.stationEvidence,
          tenantId: this.#config.tenantId,
          stationId: this.#config.stationId,
        },
      ]);
      const composition = createStationsComposition(
        connection,
        createKyselyBranchEligibilityCapability(connection),
        recognition,
      );
      const trusted = await composition.resolveTrustedStationContext.execute({
        kind: 'candidate',
        opaque: this.#config.stationEvidence,
      });
      if (
        trusted.tenantId !== this.#config.tenantId ||
        trusted.branchId !== this.#config.branchId ||
        trusted.stationId !== this.#config.stationId
      ) {
        throw new Error('Preview context does not match the server-owned scope.');
      }
      this.#connection = connection;
      this.#trustedStation = trusted;
      this.#repairs = new PreviewRepairService(
        createKyselyPreviewRepairRepository(connection),
      );
      this.#context = contextView(this.#config);
    } catch (error: unknown) {
      if (connection.state !== 'closed') {
        await connection.close();
      }
      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    const connection = this.#connection;
    this.#context = null;
    this.#trustedStation = null;
    this.#repairs = null;
    this.#connection = null;
    if (connection && connection.state !== 'closed') {
      await connection.close();
    }
  }
}
