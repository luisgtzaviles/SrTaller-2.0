import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';
import type { DeferredJobRunner } from '../synthetic/infrastructure/jobs/deferred-job-runner.js';
import type { PostgresPool } from '../synthetic/infrastructure/postgres/postgres-pool.js';
import type { OperationalLogger } from '../synthetic/infrastructure/observability/operational-logger.js';
import { TOKENS } from './tokens.js';

@Injectable()
export class LifecycleCoordinator implements OnApplicationShutdown {
  constructor(
    @Inject(TOKENS.jobs) private readonly jobs: DeferredJobRunner,
    @Inject(TOKENS.pool) private readonly pool: PostgresPool,
    @Inject(TOKENS.logger) private readonly logger: OperationalLogger,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    this.logger.info('lifecycle.shutdown.started');
    try {
      this.logger.info('lifecycle.jobs.drain.started');
      await this.jobs.drainAndStop();
      this.logger.info('lifecycle.jobs.drain.completed');
      this.logger.info('lifecycle.listener.closed');
      this.logger.info('lifecycle.database_pool.close.started');
      await this.pool.close();
      this.logger.info('lifecycle.database_pool.close.completed');
      this.logger.info('lifecycle.shutdown.completed');
    } catch (error) {
      this.logger.error('lifecycle.shutdown.unexpected_error', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });
      throw error;
    }
  }
}
