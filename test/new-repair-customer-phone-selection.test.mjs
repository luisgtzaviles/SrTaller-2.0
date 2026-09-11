import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canOfferCustomerPhoneOwnership,
  phonesEquivalent,
  resolveCustomerPhoneSelection,
} from '../apps/dev-preview-web/src/customer-phone-selection.mjs';

function candidate(overrides = {}) {
  return {
    contactPhone: '526421046041',
    contactPhones: ['526421046041', '526625551234'],
    matchedPhone: null,
    ...overrides,
  };
}

test('empty Repair phone hydrates the preferred Customer-owned phone after name selection', () => {
  assert.deepEqual(resolveCustomerPhoneSelection({ countryCode: '+52', phone: '', candidate: candidate() }), {
    countryCode: '+52', phone: '6421046041', hydrated: true,
  });
});

test('partial telephone query hydrates the complete phone that produced the match', () => {
  assert.deepEqual(resolveCustomerPhoneSelection({
    countryCode: '+52', phone: '6421', candidate: candidate({ matchedPhone: '526421046041' }),
  }), { countryCode: '+52', phone: '6421046041', hydrated: true });
});

test('a secondary matched phone wins over the preferred phone', () => {
  assert.deepEqual(resolveCustomerPhoneSelection({
    countryCode: '+52', phone: '5551', candidate: candidate({ matchedPhone: '526625551234' }),
  }), { countryCode: '+52', phone: '6625551234', hydrated: true });
});

test('a deliberate different Repair phone is preserved and offers explicit ownership opt-in', () => {
  const selected = candidate();
  assert.deepEqual(resolveCustomerPhoneSelection({ countryCode: '+52', phone: '6621234567', candidate: selected }), {
    countryCode: '+52', phone: '6621234567', hydrated: false,
  });
  assert.equal(canOfferCustomerPhoneOwnership({ candidate: selected, countryCode: '+52', phone: '6621234567' }), true);
});

test('owned phone equivalence recognizes Mexico prefix and formatting without duplicate opt-in', () => {
  const selected = candidate();
  assert.equal(phonesEquivalent('+52 642 104 6041', '526421046041'), true);
  assert.equal(phonesEquivalent('6421046041', '+52 (642) 104-6041'), true);
  assert.equal(canOfferCustomerPhoneOwnership({ candidate: selected, countryCode: '+52', phone: '6421046041' }), false);
  assert.deepEqual(resolveCustomerPhoneSelection({ countryCode: '+52', phone: '642 104 6041', candidate: selected }), {
    countryCode: '+52', phone: '6421046041', hydrated: true,
  });
});

test('an unresolved partial query never exposes Customer ownership opt-in', () => {
  assert.equal(canOfferCustomerPhoneOwnership({ candidate: candidate(), countryCode: '+52', phone: '6421' }), false);
});

test('changing Customer resolves only the new candidate matched phone and carries no stale match state', () => {
  const first = resolveCustomerPhoneSelection({
    countryCode: '+52', phone: '6421', candidate: candidate({ matchedPhone: '526421046041' }),
  });
  assert.equal(first.phone, '6421046041');
  const second = resolveCustomerPhoneSelection({
    countryCode: '+52',
    phone: '7777',
    candidate: candidate({ contactPhone: '526677778888', contactPhones: ['526677778888'], matchedPhone: '526677778888' }),
  });
  assert.deepEqual(second, { countryCode: '+52', phone: '6677778888', hydrated: true });
});
