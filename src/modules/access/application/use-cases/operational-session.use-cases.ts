import { randomUUID } from 'node:crypto';

import type { AuthenticationUserReader } from '../../../users/index.js';
import type { TrustedStationContext } from '../../../stations/index.js';
import {
  consumePinAuthenticationProof,
} from '../../domain/pin-credential.js';
import type { PinAuthenticationProof } from '../../domain/pin-credential.js';
import {
  OPERATIONAL_SESSION_ABSOLUTE_MS,
  OPERATIONAL_SESSION_IDLE_MS,
  proofMatchesContext,
  verifierEquals,
} from '../../domain/operational-session.js';
import type {
  OperationalSessionContext,
  OperationalSessionTokenMaterial,
} from '../../domain/operational-session.js';
import {
  OperationalSessionAdmissionError,
} from '../ports/operational-session-repository.port.js';
import type { OperationalSessionRepositoryPort } from '../ports/operational-session-repository.port.js';
import type { SessionTokenPort } from '../ports/session-token.port.js';
import type { ListApplicableUsersUseCase } from './list-applicable-users.use-case.js';

export class OperationalSessionError extends Error {
  readonly category = 'Authentication';
  readonly code = 'OPERATIONAL_SESSION_DENIED';

  constructor() {
    super('Operational Session was not accepted.');
    this.name = 'OperationalSessionError';
  }

  toJSON() {
    return Object.freeze({ name: this.name, category: this.category, code: this.code, message: this.message });
  }
}

function deny(): never {
  throw new OperationalSessionError();
}

async function userIsApplicable(
  listApplicableUsers: ListApplicableUsersUseCase,
  context: TrustedStationContext,
  userId: string,
): Promise<boolean> {
  const users = await listApplicableUsers.execute({
    tenantId: context.tenantId,
    branchId: context.branchId,
  });
  return users.includes(userId as never);
}

export class CreateOperationalSessionUseCase {
  constructor(
    private readonly repository: OperationalSessionRepositoryPort,
    private readonly users: AuthenticationUserReader,
    private readonly applicableUsers: ListApplicableUsersUseCase,
    private readonly tokens: SessionTokenPort,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
  ) {}

  async execute(
    context: TrustedStationContext,
    proofValue: unknown,
    expectedSessionId: string | null = null,
  ): Promise<Readonly<{
    session: OperationalSessionContext;
    tokens: OperationalSessionTokenMaterial;
  }>> {
    if (!consumePinAuthenticationProof(proofValue)) deny();
    const proof = proofValue as PinAuthenticationProof;
    const occurredAt = this.now();
    const authenticatedAt = new Date(proof.authenticatedAt).getTime();
    if (
      !proofMatchesContext(proof, context) ||
      !Number.isFinite(authenticatedAt) ||
      authenticatedAt > occurredAt.getTime() ||
      occurredAt.getTime() - authenticatedAt > 30_000
    ) deny();
    const [user, applicable, credentialCurrent] = await Promise.all([
      this.users.findAuthenticationUser({ tenantId: context.tenantId }, proof.userId),
      userIsApplicable(this.applicableUsers, context, proof.userId),
      this.repository.isPinCredentialCurrent(context, proof.userId, proof.credentialVersion),
    ]);
    if (
      !user ||
      user.status !== 'active' ||
      user.version !== proof.userVersion ||
      user.admissionRevision !== proof.userAdmissionRevision ||
      !applicable ||
      !credentialCurrent
    ) deny();
    const tokens = this.tokens.issue();
    let session: Awaited<ReturnType<OperationalSessionRepositoryPort['createReplacingActive']>>;
    try {
      session = await this.repository.createReplacingActive(context, {
        sessionId: this.createId(),
        userId: proof.userId,
        userVersion: proof.userVersion,
        userAdmissionRevision: proof.userAdmissionRevision,
        credentialVersion: proof.credentialVersion,
        bearerVerifier: tokens.bearerVerifier,
        csrfVerifier: tokens.csrfVerifier,
        expectedSessionId,
        occurredAt: occurredAt.toISOString(),
        expiresAt: new Date(occurredAt.getTime() + OPERATIONAL_SESSION_ABSOLUTE_MS).toISOString(),
      });
    } catch (error: unknown) {
      if (error instanceof OperationalSessionAdmissionError) deny();
      throw error;
    }
    return Object.freeze({
      tokens,
      session: Object.freeze({ ...session, displayName: user.displayName, status: 'active' }),
    });
  }
}

export class ResolveOperationalSessionUseCase {
  constructor(
    private readonly repository: OperationalSessionRepositoryPort,
    private readonly users: AuthenticationUserReader,
    private readonly applicableUsers: ListApplicableUsersUseCase,
    private readonly tokens: SessionTokenPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(context: TrustedStationContext, input: Readonly<{
    bearer: string;
    csrfCookie: string;
    csrfHeader?: string | undefined;
    requireCsrf?: boolean;
    touch?: boolean;
  }>): Promise<OperationalSessionContext> {
    let bearerVerifier: Uint8Array;
    let csrfVerifier: Uint8Array;
    try {
      bearerVerifier = this.tokens.verifyBearer(input.bearer);
      csrfVerifier = this.tokens.verifyCsrf(input.csrfCookie);
    } catch {
      deny();
    }
    if (input.requireCsrf) {
      if (typeof input.csrfHeader !== 'string' || input.csrfHeader !== input.csrfCookie) deny();
    }
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const row = await this.repository.findByBearerVerifier(context, bearerVerifier);
      if (!row || row.status !== 'active' || !verifierEquals(row.csrfVerifier, csrfVerifier)) deny();
      const now = this.now();
      const nowMs = now.getTime();
      const idleAt = new Date(row.lastActivityAt).getTime() + OPERATIONAL_SESSION_IDLE_MS;
      const absoluteAt = new Date(row.expiresAt).getTime();
      if (nowMs >= idleAt || nowMs >= absoluteAt) {
        const closed = await this.repository.close(context, {
          sessionId: row.sessionId,
          expectedVersion: row.version,
          status: 'expired',
          occurredAt: now.toISOString(),
        });
        if (closed) deny();
        continue;
      }
      const [user, applicable, credentialCurrent] = await Promise.all([
        this.users.findAuthenticationUser({ tenantId: context.tenantId }, row.userId),
        userIsApplicable(this.applicableUsers, context, row.userId),
        this.repository.isPinCredentialCurrent(context, row.userId, row.credentialVersion),
      ]);
      if (!user || user.status !== 'active' || !applicable || !credentialCurrent) {
        const closed = await this.repository.close(context, {
          sessionId: row.sessionId,
          expectedVersion: row.version,
          status: 'invalidated',
          occurredAt: now.toISOString(),
        });
        if (closed) deny();
        continue;
      }
      const current = await this.repository.confirmActive(context, {
        sessionId: row.sessionId,
        expectedVersion: row.version,
        occurredAt: now.toISOString(),
        recordActivity: input.touch !== false,
      });
      if (!current) continue;
      return Object.freeze({ ...current, status: 'active' });
    }
    deny();
  }
}

export class EndOperationalSessionUseCase {
  constructor(
    private readonly repository: OperationalSessionRepositoryPort,
    private readonly tokens: SessionTokenPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(context: TrustedStationContext, input: Readonly<{
    bearer: string;
    csrfCookie: string;
    csrfHeader: string | undefined;
  }>): Promise<void> {
    if (input.csrfHeader !== input.csrfCookie) deny();
    let bearerVerifier: Uint8Array;
    let csrfVerifier: Uint8Array;
    try {
      bearerVerifier = this.tokens.verifyBearer(input.bearer);
      csrfVerifier = this.tokens.verifyCsrf(input.csrfCookie);
    } catch {
      deny();
    }
    const closed = await this.repository.closeAuthenticated(context, {
      bearerVerifier,
      csrfVerifier,
      status: 'logged_out',
      occurredAt: this.now().toISOString(),
    });
    if (!closed) deny();
  }
}

export class ListLoginUsersUseCase {
  constructor(
    private readonly users: AuthenticationUserReader,
    private readonly applicableUsers: ListApplicableUsersUseCase,
  ) {}

  async execute(context: TrustedStationContext) {
    const ids = await this.applicableUsers.execute({
      tenantId: context.tenantId,
      branchId: context.branchId,
    });
    const users = await Promise.all(ids.map((userId) =>
      this.users.findAuthenticationUser({ tenantId: context.tenantId }, userId)));
    return Object.freeze(users
      .filter((user): user is NonNullable<typeof user> => user?.status === 'active')
      .map(({ userId, displayName }) => Object.freeze({ userId, displayName }))
      .sort((left, right) => left.displayName.localeCompare(right.displayName, 'es')));
  }
}
