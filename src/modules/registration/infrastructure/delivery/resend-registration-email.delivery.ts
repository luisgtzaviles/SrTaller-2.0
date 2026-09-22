import { ResendEmailDelivery } from '../../../../infrastructure/email/email-delivery.js';
import type { RegistrationEmailDeliveryPort, RegistrationEmailDeliveryResult, RegistrationEmailMessage } from '../../application/ports/registration-email-delivery.port.js';

type FetchLike = (input: string, init: RequestInit) => Promise<Readonly<{
  ok: boolean;
  json(): Promise<unknown>;
}>>;

export class ResendRegistrationEmailDelivery implements RegistrationEmailDeliveryPort {
  readonly #delivery: ResendEmailDelivery;
  constructor(
    apiKey: string,
    sender: string,
    fetcher: FetchLike = fetch,
  ) {
    this.#delivery = new ResendEmailDelivery(apiKey, sender, fetcher);
  }

  async deliver(message: RegistrationEmailMessage): Promise<RegistrationEmailDeliveryResult> {
    return this.#delivery.deliver({ ...message, actionUrl: message.verificationUrl });
  }

  toJSON(): Readonly<{ adapter: 'resend'; sender: string; apiKey: '[REDACTED]' }> {
    return this.#delivery.toJSON();
  }

}
