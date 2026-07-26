import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTrustedStationContext,
  isTrustedStationContext,
} from '../dist/modules/stations/application/contracts/trusted-station-context.js';
import {
  StationApplicationError,
  toPublicStationError,
} from '../dist/modules/stations/application/station-application.error.js';
import {
  createStation,
  linkStation,
  parseStationId,
  parseStationRevision,
  revokeStation,
  StationDomainError,
  unlinkStation,
} from '../dist/modules/stations/domain/station.js';
import {
  parseBranchId,
  parseTenantId,
} from '../dist/modules/tenancy/index.js';

const tenantId = parseTenantId('10000000-0000-4000-8000-000000000001');
const branchId = parseBranchId('20000000-0000-4000-8000-000000000002');
const stationId = parseStationId('30000000-0000-4000-8000-000000000003');
const t1 = '2026-07-26T16:00:00.000Z';
const t2 = '2026-07-26T16:01:00.000Z';
const t3 = '2026-07-26T16:02:00.000Z';
const t4 = '2026-07-26T16:03:00.000Z';

function expectsDomainCode(code) {
  return (error) => {
    assert.ok(error instanceof StationDomainError);
    assert.equal(error.code, code);
    return true;
  };
}

test('Station IDs, revisions and instants fail closed', () => {
  assert.equal(parseStationId(stationId), stationId);
  assert.equal(parseStationRevision(1), 1);
  assert.throws(() => parseStationId(''), expectsDomainCode('STATION_ID_INVALID'));
  assert.throws(
    () => parseStationRevision(0),
    expectsDomainCode('STATION_REVISION_INVALID'),
  );
  assert.throws(
    () => createStation({ tenantId, stationId, createdAt: 'not-an-instant' }),
    expectsDomainCode('STATION_INSTANT_INVALID'),
  );
});

test('Station lifecycle is immutable, monotonic and requires unlink before relink', () => {
  const created = createStation({ tenantId, stationId, createdAt: t1 });
  const linked = linkStation(created, created.revision, t2);
  const unlinked = unlinkStation(linked, linked.revision, t3);
  const relinked = linkStation(unlinked, unlinked.revision, t4);

  assert.deepEqual(
    [created.status, linked.status, unlinked.status, relinked.status],
    ['Unlinked', 'Active', 'Unlinked', 'Active'],
  );
  assert.deepEqual(
    [created.revision, linked.revision, unlinked.revision, relinked.revision],
    [1, 2, 3, 4],
  );
  assert.ok([created, linked, unlinked, relinked].every(Object.isFrozen));
  assert.throws(
    () => linkStation(linked, linked.revision, t3),
    expectsDomainCode('STATION_LIFECYCLE_CONFLICT'),
  );
  assert.throws(
    () => unlinkStation(unlinked, unlinked.revision, t4),
    expectsDomainCode('STATION_LIFECYCLE_CONFLICT'),
  );
  assert.throws(
    () => unlinkStation(linked, created.revision, t3),
    expectsDomainCode('STATION_CONTEXT_STALE'),
  );
});

test('Revoked is terminal and records the terminal instant', () => {
  const created = createStation({ tenantId, stationId, createdAt: t1 });
  const active = linkStation(created, created.revision, t2);
  const revoked = revokeStation(active, active.revision, t3);

  assert.equal(revoked.status, 'Revoked');
  assert.equal(revoked.revision, 3);
  assert.equal(revoked.revokedAt, t3);
  assert.throws(
    () => revokeStation(revoked, revoked.revision, t4),
    expectsDomainCode('STATION_LIFECYCLE_CONFLICT'),
  );
  assert.throws(
    () => linkStation(revoked, revoked.revision, t4),
    expectsDomainCode('STATION_LIFECYCLE_CONFLICT'),
  );
  assert.throws(
    () => unlinkStation(revoked, revoked.revision, t4),
    expectsDomainCode('STATION_LIFECYCLE_CONFLICT'),
  );
});

test('TrustedStationContext is immutable, internally issued and has no wildcard', () => {
  const context = createTrustedStationContext({
    tenantId,
    branchId,
    stationId,
    stationRevision: parseStationRevision(2),
  });
  assert.deepEqual(context, {
    tenantId,
    branchId,
    stationId,
    stationRevision: 2,
    source: 'server-verified-station',
  });
  assert.ok(Object.isFrozen(context));
  assert.equal(isTrustedStationContext(context), true);
  assert.equal(
    isTrustedStationContext({
      ...context,
      source: 'server-verified-station',
    }),
    false,
  );
  assert.equal('actorId' in context, false);
  assert.equal('sessionId' in context, false);
  assert.equal('correlationId' in context, false);
});

test('public error contract is stable, sanitized and anti-enumerating', () => {
  const unknown = toPublicStationError(
    new StationApplicationError('STATION_NOT_TRUSTED'),
  );
  const revoked = toPublicStationError(
    new StationApplicationError('STATION_EVIDENCE_REJECTED'),
  );
  const otherTenant = toPublicStationError(
    new StationApplicationError('STATION_TENANT_NOT_RECOGNIZED'),
  );
  assert.deepEqual(unknown, revoked);
  assert.deepEqual(revoked, otherTenant);
  assert.deepEqual(
    toPublicStationError(
      new StationApplicationError('STATION_BRANCH_NOT_ELIGIBLE'),
    ),
    {
      code: 'RESOURCE_NOT_FOUND',
      status: 404,
      message: 'El recurso no está disponible.',
    },
  );
  const internal = JSON.stringify(
    toPublicStationError(
      new StationApplicationError('STATION_REFERENCE_INTEGRITY_BROKEN'),
    ),
  );
  assert.doesNotMatch(
    internal,
    /sql|23503|constraint|tenant|branch|station|stack|secret/iu,
  );
});
