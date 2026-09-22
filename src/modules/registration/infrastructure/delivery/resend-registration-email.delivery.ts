import { inspect } from 'node:util';

import type { RegistrationEmailDeliveryPort, RegistrationEmailDeliveryResult, RegistrationEmailMessage } from '../../application/ports/registration-email-delivery.port.js';

type FetchLike = (input: string, init: RequestInit) => Promise<Readonly<{
  ok: boolean;
  json(): Promise<unknown>;
}>>;

export class ResendRegistrationEmailDelivery implements RegistrationEmailDeliveryPort {
  readonly #apiKey: string;
  constructor(
    apiKey: string,
    private readonly sender: string,
    private readonly fetcher: FetchLike = fetch,
  ) {
    if (!/^re_[A-Za-z0-9_-]{16,}$/u.test(apiKey) || sender !== 'SR Taller <no-reply@srtaller.com>') {
      throw new Error('Resend registration delivery configuration is invalid.');
    }
    this.#apiKey = apiKey;
  }

  async deliver(message: RegistrationEmailMessage): Promise<RegistrationEmailDeliveryResult> {
    try {
      const response = await this.fetcher('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.#apiKey}`,
          'content-type': 'application/json',
          'idempotency-key': message.deliveryId,
        },
        body: JSON.stringify({
          from: this.sender,
          to: [message.destination],
          subject: 'Verifica tu registro en SR Taller',
          html: `<p>Confirma tu registro en SR Taller.</p><p><a href="${message.verificationUrl}">Verificar correo</a></p><p>Este enlace vence en 60 minutos.</p>`,
        }),
      });
      if (!response.ok) return Object.freeze({ status: 'FAILED', providerReference: null, reasonCode: 'PROVIDER_REJECTED' });
      const body = await response.json();
      const reference = typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string'
        ? body.id.slice(0, 160)
        : null;
      return Object.freeze({ status: 'DELIVERED', providerReference: reference, reasonCode: 'ACCEPTED' });
    } catch {
      return Object.freeze({ status: 'FAILED', providerReference: null, reasonCode: 'PROVIDER_UNAVAILABLE' });
    }
  }

  toJSON(): Readonly<{ adapter: 'resend'; sender: string; apiKey: '[REDACTED]' }> {
    return Object.freeze({ adapter: 'resend', sender: this.sender, apiKey: '[REDACTED]' });
  }

  [inspect.custom](): ReturnType<ResendRegistrationEmailDelivery['toJSON']> {
    return this.toJSON();
  }
}
