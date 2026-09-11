export function phoneDigits(value) {
  return String(value ?? '').replace(/[^0-9]/gu, '');
}

export function customerPhoneParts(value) {
  const normalized = phoneDigits(value);
  if (normalized.startsWith('52') && normalized.length > 10) {
    return Object.freeze({ countryCode: '+52', nationalPhone: normalized.slice(2) });
  }
  return Object.freeze({ countryCode: '', nationalPhone: normalized });
}

function phoneEquivalenceKey(value) {
  const normalized = phoneDigits(value);
  return normalized.startsWith('52') && normalized.length === 12 ? normalized.slice(2) : normalized;
}

export function phonesEquivalent(left, right) {
  const leftKey = phoneEquivalenceKey(left);
  const rightKey = phoneEquivalenceKey(right);
  return Boolean(leftKey && rightKey && leftKey === rightKey);
}

function ownedPhones(candidate) {
  return [...new Set([
    ...(candidate.contactPhones ?? []),
    candidate.contactPhone,
    candidate.matchedPhone,
  ].filter(Boolean))];
}

export function resolveCustomerPhoneSelection({ countryCode, phone, candidate }) {
  const currentNational = phoneDigits(phone);
  const currentFull = phoneDigits(`${countryCode}${phone}`);
  const matchedPhone = candidate.matchedPhone;
  const matchedByCurrentQuery = Boolean(
    matchedPhone
    && currentNational.length >= 2
    && phoneDigits(matchedPhone).includes(currentNational),
  );
  const equivalentOwnedPhone = ownedPhones(candidate).find((ownedPhone) => phonesEquivalent(currentFull, ownedPhone));
  const hydrationPhone = matchedByCurrentQuery
    ? matchedPhone
    : currentNational.length === 0
      ? matchedPhone ?? candidate.contactPhone
      : equivalentOwnedPhone;

  if (!hydrationPhone) {
    return Object.freeze({ countryCode, phone: currentNational, hydrated: false });
  }
  const parts = customerPhoneParts(hydrationPhone);
  return Object.freeze({ countryCode: parts.countryCode, phone: parts.nationalPhone, hydrated: true });
}

export function canOfferCustomerPhoneOwnership({ candidate, countryCode, phone }) {
  if (!candidate) return false;
  const repairPhone = phoneDigits(`${countryCode}${phone}`);
  if (repairPhone.length < 7 || repairPhone.length > 20) return false;
  return !ownedPhones(candidate).some((ownedPhone) => phonesEquivalent(repairPhone, ownedPhone));
}
