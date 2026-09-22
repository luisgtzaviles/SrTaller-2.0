import { LocalEmailDelivery } from '../../../../infrastructure/email/email-delivery.js';
import type { RegistrationEmailDeliveryPort, RegistrationEmailDeliveryResult, RegistrationEmailMessage } from '../../application/ports/registration-email-delivery.port.js';

/** Local mailbox retains messages in memory and never logs verification URLs. */
export class LocalRegistrationEmailDelivery implements RegistrationEmailDeliveryPort {
  readonly #delivery = new LocalEmailDelivery();

  async deliver(message: RegistrationEmailMessage): Promise<RegistrationEmailDeliveryResult> {
    return this.#delivery.deliver({ ...message, actionUrl: message.verificationUrl });
  }

  takeLatestForTest(): RegistrationEmailMessage | null {
    const message = this.#delivery.takeLatestForTest();
    return message === null ? null : Object.freeze({ ...message, templateKey: 'registration-verification', verificationUrl: message.actionUrl });
  }

  toJSON(): Readonly<{ adapter: 'local'; captured: number; messages: '[REDACTED]' }> {
    return this.#delivery.toJSON();
  }
}
