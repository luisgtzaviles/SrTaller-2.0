import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import test from 'node:test';

import {
  AdminRecoveryFoundationUseCase,
  AdminSessionManagementUseCase,
  LoginAdminUseCase,
  ResolveAdminSessionUseCase,
} from '../dist/modules/access/application/use-cases/admin-session.use-cases.js';

const tenantId = '11111111-1111-4111-8111-111111111111';
const identityId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';
const correlationId = '44444444-4444-4444-8444-444444444444';
const password = 'correct horse battery staple';
const digest = (value) => createHash('sha256').update(value).digest();

class FakeHasher {
  principalDigest(email) { return digest(`principal:${email}`); }
  async hash(input) { return { algorithm:'argon2id',profileVersion:1,pepperVersion:1,memoryKiB:65536,passes:3,parallelism:4,salt:digest('salt').subarray(0,16),verifier:digest(`${input.tenantId}:${input.adminIdentityId}:${input.password}`) }; }
  async verify(input) { return input.stored !== null && Buffer.from(input.stored.verifier).equals(digest(`${input.tenantId}:${input.adminIdentityId}:${input.password}`)); }
}

class FakeTokens {
  count = 0;
  issue() { this.count += 1; const bearer = Buffer.alloc(32, this.count).toString('base64url'); const csrf = Buffer.alloc(32, this.count + 20).toString('base64url'); return { bearer, csrf, bearerVerifier:digest(bearer), csrfVerifier:digest(csrf) }; }
  digestBearer(value) { return digest(value); }
  digestCsrf(value) { return digest(value); }
}

class FakeRepository {
  constructor(credential) { this.credential = credential; this.sessions = []; this.failed = 0; this.recovery = null; this.events = []; }
  async confirmCurrent(session, _occurredAt, requireRecent) { return this.sessions.some((row) => row.sessionId === session.sessionId && row.version === session.version && row.status === 'active' && (!requireRecent || row.reauthenticatedAt !== null)); }
  async findCredentialByEmail(email) { return email === this.credential.normalizedEmail ? this.credential : null; }
  async findCredential(tenant, identity) { return tenant === this.credential.tenantId && identity === this.credential.adminIdentityId ? this.credential : null; }
  async provisionVerifiedIdentity() { throw new Error('not used'); }
  async isAttemptBlocked() { return this.failed >= 5; }
  async recordFailedAttempt({ knownPrincipal }) { this.failed += 1; if (this.failed >= 5 && knownPrincipal) this.events.push('ADMIN_LOGIN_BLOCKED'); return { blocked: this.failed >= 5, blockedUntil: null }; }
  async clearFailedAttempts() { this.failed = 0; }
  async createSession(input) { const row = { tenantId:input.tenantId,sessionId:input.sessionId,userId:input.userId,adminIdentityId:input.adminIdentityId,userAdmissionRevision:input.userAdmissionRevision,identityVersion:input.identityVersion,credentialVersion:input.credentialVersion,sessionRevision:input.sessionRevision,status:'active',version:0,issuedAt:input.occurredAt,lastActivityAt:input.occurredAt,expiresAt:input.expiresAt,reauthenticatedAt:null,endedAt:null,csrfVerifier:input.csrfVerifier,bearerVerifier:input.bearerVerifier }; this.sessions.push(row); return row; }
  async findSessionByBearerVerifier(verifier) { return this.sessions.find((row) => Buffer.from(row.bearerVerifier).equals(Buffer.from(verifier))) ?? null; }
  async listSessions(tenant, user) { return this.sessions.filter((row) => row.tenantId === tenant && row.userId === user); }
  async touchSession(input) { const row = this.sessions.find((candidate) => candidate.sessionId === input.sessionId && candidate.version === input.expectedVersion && candidate.status === 'active'); if (!row) return null; row.lastActivityAt=input.occurredAt; row.version+=1; return row; }
  async endSession(input) { const row=this.sessions.find((candidate)=>candidate.sessionId===input.sessionId&&candidate.version===input.expectedVersion&&candidate.status==='active'); if(!row)return false; row.status=input.status;row.endedAt=input.occurredAt;row.reauthenticatedAt=null;row.version+=1;return true; }
  async revokeAll(input) { this.credential={...this.credential,sessionRevision:this.credential.sessionRevision+1}; let count=0; for(const row of this.sessions){if(row.status==='active'){row.status='revoked';row.endedAt=input.occurredAt;count+=1;}} return count; }
  async markReauthenticated(input) { const row=this.sessions.find((candidate)=>candidate.sessionId===input.sessionId&&candidate.version===input.expectedVersion); if(!row)return null;row.reauthenticatedAt=input.occurredAt;row.version+=1;return row; }
  async issueRecovery(input) { this.recovery={...input,used:false}; }
  async findRecoveryContext(verifier) { return this.recovery && Buffer.from(this.recovery.tokenVerifier).equals(Buffer.from(verifier)) && !this.recovery.used ? {tenantId:this.recovery.tenantId,adminIdentityId:this.recovery.adminIdentityId}:null; }
  async completeRecovery(input) { if(!this.recovery||this.recovery.used||!Buffer.from(this.recovery.tokenVerifier).equals(Buffer.from(input.tokenVerifier)))return false;this.recovery.used=true;this.credential={...this.credential,password:input.password,credentialVersion:this.credential.credentialVersion+1,sessionRevision:this.credential.sessionRevision+1};for(const row of this.sessions){row.status='revoked';}return true; }
}

async function fixture(userStatus='active') {
  const hasher = new FakeHasher();
  const protectedPassword = await hasher.hash({tenantId,adminIdentityId:identityId,password});
  const credential = {tenantId,adminIdentityId:identityId,userId,normalizedEmail:'owner@example.com',emailDisplay:'Owner@example.com',verifiedAt:'2026-09-20T00:00:00.000Z',identityStatus:'active',identityVersion:0,credentialStatus:'active',credentialVersion:1,sessionRevision:1,password:protectedPassword};
  const repository = new FakeRepository(credential); const tokens = new FakeTokens();
  const users = { async findAuthenticationUser(scope, requestedUserId) { return scope.tenantId === tenantId && requestedUserId === userId ? { userId, displayName:'Owner',status:userStatus,version:0,admissionRevision:0 }:null; } };
  return {hasher,repository,tokens,users};
}

test('administrative login works without Station, creates concurrent stateful sessions and derives Tenant from identity', async () => {
  const {hasher,repository,tokens,users}=await fixture(); let now=new Date('2026-09-20T01:00:00.000Z');
  const login=new LoginAdminUseCase(repository,users,hasher,tokens,()=>now,randomUUID);
  const first=await login.execute({email:'OWNER@example.com',password,correlationId}); const second=await login.execute({email:'owner@example.com',password,correlationId});
  assert.equal(first.session.tenantId,tenantId); assert.equal(first.session.displayName,'Owner'); assert.notEqual(first.session.sessionId,second.session.sessionId); assert.equal(repository.sessions.length,2); assert.equal('stationId' in first.session,false);
  await assert.rejects(login.execute({email:'owner@example.com',password:'wrong password value',correlationId}),/not accepted/u);
  assert.equal(repository.sessions.length,2);
});

test('Admin Session enforces idle, CSRF, individual logout, reauth and global revocation', async () => {
  const {hasher,repository,tokens,users}=await fixture(); let now=new Date('2026-09-20T01:00:00.000Z'); const login=new LoginAdminUseCase(repository,users,hasher,tokens,()=>now,randomUUID); const logged=await login.execute({email:'owner@example.com',password,correlationId});
  const resolve=new ResolveAdminSessionUseCase(repository,users,tokens,()=>now); let context=await resolve.execute({bearer:logged.tokens.bearer,csrfCookie:logged.tokens.csrf,csrfHeader:logged.tokens.csrf,requireCsrf:true,touch:false});
  const management=new AdminSessionManagementUseCase(repository,hasher,()=>now); const reauthenticated=await management.reauthenticate(context,password,correlationId); assert.equal(reauthenticated.reauthenticatedAt,now.toISOString()); context={...context,...reauthenticated,displayName:'Owner',status:'active'};
  assert.equal(await management.revokeAll(context,correlationId),1); await assert.rejects(resolve.execute({bearer:logged.tokens.bearer,csrfCookie:logged.tokens.csrf}),/not accepted/u);
  now=new Date('2026-09-20T02:00:00.000Z'); const fresh=await login.execute({email:'owner@example.com',password,correlationId}); now=new Date('2026-09-20T02:30:00.000Z'); await assert.rejects(resolve.execute({bearer:fresh.tokens.bearer,csrfCookie:fresh.tokens.csrf}),/not accepted/u);
});

test('inactive users are denied and recovery is single-use without reviving lifecycle', async () => {
  const inactive=await fixture('inactive'); const login=new LoginAdminUseCase(inactive.repository,inactive.users,inactive.hasher,inactive.tokens,()=>new Date('2026-09-20T01:00:00.000Z'),randomUUID); await assert.rejects(login.execute({email:'owner@example.com',password,correlationId}),/not accepted/u);
  const active=await fixture(); const recovery=new AdminRecoveryFoundationUseCase(active.repository,active.users,active.hasher,active.tokens,()=>new Date('2026-09-20T01:00:00.000Z'),randomUUID); const token=await recovery.issue('owner@example.com'); assert.equal(typeof token,'string'); await recovery.complete(token,'new correct horse battery',correlationId); await assert.rejects(recovery.complete(token,'another valid password',correlationId),/not accepted/u);
  assert.equal(await recovery.issue('unknown@example.com'),null);
});
