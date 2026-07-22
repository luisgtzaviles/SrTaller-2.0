export class DomainValidationError extends Error {
  readonly code = 'DOMAIN_VALIDATION';

  constructor(message: string) {
    super(message);
    this.name = 'DomainValidationError';
  }
}
