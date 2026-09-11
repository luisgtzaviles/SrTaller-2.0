export interface CustomerPhoneSelectionCandidate {
  readonly contactPhone: string | null;
  readonly contactPhones: readonly string[];
  readonly matchedPhone: string | null;
}

export function phoneDigits(value: unknown): string;
export function customerPhoneParts(value: unknown): Readonly<{ countryCode: string; nationalPhone: string }>;
export function phonesEquivalent(left: unknown, right: unknown): boolean;
export function resolveCustomerPhoneSelection(input: Readonly<{
  countryCode: string;
  phone: string;
  candidate: CustomerPhoneSelectionCandidate;
}>): Readonly<{ countryCode: string; phone: string; hydrated: boolean }>;
export function canOfferCustomerPhoneOwnership(input: Readonly<{
  candidate: CustomerPhoneSelectionCandidate | null;
  countryCode: string;
  phone: string;
}>): boolean;
