import { randomUUID } from 'node:crypto';
import { useDatabasePersistenceExecutor, useTransactionalDatabasePersistenceExecutor } from '../../../../infrastructure/database/database-persistence-capability.js';
import { parseTenantId } from '../../../tenancy/index.js';
import type { CustomerIntakeInput, CustomerIntakeRecord, CustomerIntakeScope, CustomerSearchCandidate } from '../../index.js';
import type { CustomerIntakePersistencePort } from '../../application/ports/customer-intake-runtime.port.js';

const digits = /^\d{7,20}$/u;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function normalizeCustomerPhone(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new TypeError('Customer phone is invalid.');
  const normalized = value.replace(/[^0-9]/gu, '');
  if (!digits.test(normalized)) throw new TypeError('Customer phone is invalid.');
  return normalized;
}

function normalizeGivenName(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('Customer name is invalid.');
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length < 1 || normalized.length > 80) throw new TypeError('Customer name is invalid.');
  return normalized;
}

function normalizeFamilyName(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new TypeError('Customer family name is invalid.');
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length < 1 || normalized.length > 120) throw new TypeError('Customer family name is invalid.');
  return normalized;
}

function displayName(givenName: string, familyName: string | null): string {
  return familyName ? `${givenName} ${familyName}` : givenName;
}

function normalizeQuery(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('Customer search query is invalid.');
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (normalized.length < 2 || normalized.length > 160) throw new TypeError('Customer search query is invalid.');
  return normalized;
}

function trustedScope(scope: CustomerIntakeScope): CustomerIntakeScope {
  if (!uuid.test(scope.branchId)) throw new TypeError('Customer Branch scope is invalid.');
  return Object.freeze({ tenantId: parseTenantId(scope.tenantId), branchId: scope.branchId });
}

export class KyselyCustomerIntakeRepository implements CustomerIntakePersistencePort {
  constructor(private readonly connection: object) {}

  async search(scope: CustomerIntakeScope, queryInput: string): Promise<readonly CustomerSearchCandidate[]> {
    const trusted = trustedScope(scope);
    const query = normalizeQuery(queryInput);
    const phone = query.replace(/[^0-9]/gu, '');
    const nameTerms = query.split(' ');
    return useDatabasePersistenceExecutor(this.connection, 'customers', async (database) => {
      const nameMatches = await database.selectFrom('customers')
        .select('customer_id')
        .where('tenant_id', '=', trusted.tenantId)
        .where('branch_id', '=', trusted.branchId)
        .where((expression) => expression.and(nameTerms.map((term) => expression.or([
          expression('given_name', 'ilike', `%${term}%`),
          expression('family_name', 'ilike', `%${term}%`),
        ]))))
        .orderBy('given_name', 'asc')
        .orderBy('family_name', 'asc')
        .limit(8)
        .execute();
      const phoneMatches = phone.length >= 2
        ? await database.selectFrom('customer_contact_phones')
          .innerJoin('customers', (join) => join
            .onRef('customers.tenant_id', '=', 'customer_contact_phones.tenant_id')
            .onRef('customers.branch_id', '=', 'customer_contact_phones.branch_id')
            .onRef('customers.customer_id', '=', 'customer_contact_phones.customer_id'))
          .select(['customers.customer_id', 'customer_contact_phones.phone_normalized', 'customer_contact_phones.created_at', 'customer_contact_phones.customer_contact_phone_id'])
          .where('customer_contact_phones.tenant_id', '=', trusted.tenantId)
          .where('customer_contact_phones.branch_id', '=', trusted.branchId)
          .where('customer_contact_phones.phone_normalized', 'like', `%${phone}%`)
          .orderBy('customers.given_name', 'asc')
          .orderBy('customers.family_name', 'asc')
          .orderBy('customer_contact_phones.created_at', 'asc')
          .orderBy('customer_contact_phones.customer_contact_phone_id', 'asc')
          .limit(8)
          .execute()
        : [];
      const matchedCustomerIds = [...new Set([...nameMatches, ...phoneMatches].map((item) => item.customer_id))];
      if (matchedCustomerIds.length === 0) return Object.freeze([]);
      const hydratedMatches = await database.selectFrom('customers')
        .leftJoin('customer_contact_phones', (join) => join
          .onRef('customer_contact_phones.tenant_id', '=', 'customers.tenant_id')
          .onRef('customer_contact_phones.branch_id', '=', 'customers.branch_id')
          .onRef('customer_contact_phones.customer_id', '=', 'customers.customer_id'))
        .select(['customers.customer_id', 'customers.given_name', 'customers.family_name', 'customer_contact_phones.phone_normalized', 'customer_contact_phones.created_at', 'customer_contact_phones.customer_contact_phone_id'])
        .where('customers.tenant_id', '=', trusted.tenantId)
        .where('customers.branch_id', '=', trusted.branchId)
        .where('customers.customer_id', 'in', matchedCustomerIds)
        .orderBy('customers.given_name', 'asc')
        .orderBy('customers.family_name', 'asc')
        .orderBy('customer_contact_phones.created_at', 'asc')
        .orderBy('customer_contact_phones.customer_contact_phone_id', 'asc')
        .execute();
      const matchedPhones = new Map<string, string>();
      for (const item of phoneMatches) {
        if (!matchedPhones.has(item.customer_id)) matchedPhones.set(item.customer_id, item.phone_normalized);
      }
      const matches = new Map<string, {
        customerId: string;
        givenName: string;
        familyName: string | null;
        displayName: string;
        contactPhones: string[];
      }>();
      for (const item of hydratedMatches) {
        const current = matches.get(item.customer_id) ?? {
          customerId: item.customer_id,
          givenName: item.given_name,
          familyName: item.family_name,
          displayName: displayName(item.given_name, item.family_name),
          contactPhones: [],
        };
        if (item.phone_normalized && !current.contactPhones.includes(item.phone_normalized)) current.contactPhones.push(item.phone_normalized);
        matches.set(item.customer_id, current);
      }
      return Object.freeze([...matches.values()].slice(0, 8).map((candidate): CustomerSearchCandidate => Object.freeze({
        customerId: candidate.customerId,
        givenName: candidate.givenName,
        familyName: candidate.familyName,
        displayName: candidate.displayName,
        contactPhone: candidate.contactPhones[0] ?? null,
        contactPhones: Object.freeze([...candidate.contactPhones]),
        matchedPhone: matchedPhones.get(candidate.customerId) ?? null,
      })));
    });
  }

  async resolveSelectedOrCreate(
    scope: CustomerIntakeScope,
    input: CustomerIntakeInput,
    transactionContext: object,
  ): Promise<CustomerIntakeRecord> {
    const trusted = trustedScope(scope);
    const contactPhone = normalizeCustomerPhone(input.contactPhone);
    return useTransactionalDatabasePersistenceExecutor(transactionContext, 'customers', async (database) => {
      const now = new Date();
      const selected = input.customerId
        ? await database.selectFrom('customers').select(['customer_id', 'given_name', 'family_name'])
          .where('tenant_id', '=', trusted.tenantId)
          .where('branch_id', '=', trusted.branchId)
          .where('customer_id', '=', input.customerId)
          .executeTakeFirst()
        : undefined;
      if (input.customerId && !selected) throw new TypeError('Selected customer is unavailable.');
      const customer = selected ?? await database.insertInto('customers').values({
        customer_id: randomUUID(),
        tenant_id: trusted.tenantId,
        branch_id: trusted.branchId,
        given_name: normalizeGivenName(input.givenName),
        family_name: normalizeFamilyName(input.familyName),
        created_at: now,
      }).returning(['customer_id', 'given_name', 'family_name']).executeTakeFirstOrThrow();
      // A selected Customer changes only through the explicit ownership command.
      if (contactPhone && (!selected || input.addCustomerContactPhone)) {
        await database.insertInto('customer_contact_phones').values({
          customer_contact_phone_id: randomUUID(), tenant_id: trusted.tenantId, branch_id: trusted.branchId, customer_id: customer.customer_id,
          phone_normalized: contactPhone, created_at: now,
        }).onConflict((conflict) => conflict.columns(['tenant_id', 'branch_id', 'customer_id', 'phone_normalized']).doNothing()).execute();
      }
      return Object.freeze({
        customerId: customer.customer_id,
        tenantId: trusted.tenantId,
        branchId: trusted.branchId,
        givenName: customer.given_name,
        familyName: customer.family_name,
        displayName: displayName(customer.given_name, customer.family_name),
        created: !selected,
      });
    });
  }
}
