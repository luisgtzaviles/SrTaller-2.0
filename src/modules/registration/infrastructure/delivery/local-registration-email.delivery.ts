import type { RegistrationEmailDeliveryPort, RegistrationEmailDeliveryResult, RegistrationEmailMessage } from '../../application/ports/registration-email-delivery.port.js';

/** Local mailbox retains messages in memory and never logs verification URLs. */
export class LocalRegistrationEmailDelivery implements RegistrationEmailDeliveryPort {
  readonly #messages: RegistrationEmailMessage[] = [];

  async deliver(message: RegistrationEmailMessage): Promise<RegistrationEmailDeliveryResult> {
    this.#messages.push(Object.freeze({ ...message }));
    return Object.freeze({ status: 'DELIVERED', providerReference: null, reasonCode: 'ACCEPTED' });
  }

  takeLatestForTest(): RegistrationEmailMessage | null {
    return this.#messages.at(-1) ?? null;
  }

  toJSON(): Readonly<{ adapter: 'local'; captured: number; messages: '[REDACTED]' }> {
    return Object.freeze({ adapter: 'local', captured: this.#messages.length, messages: '[REDACTED]' });
  }
}
