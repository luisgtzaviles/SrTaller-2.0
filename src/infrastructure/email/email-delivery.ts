import { inspect } from 'node:util';

export type EmailDeliveryMessage = Readonly<{
  deliveryId: string;
  destination: string;
  templateKey: 'registration-verification' | 'admin-invitation';
  templateVersion: 1;
  actionUrl: string;
  expiresAt: string;
}>;

export type EmailDeliveryResult = Readonly<{
  status: 'DELIVERED' | 'FAILED';
  providerReference: string | null;
  reasonCode: 'ACCEPTED' | 'PROVIDER_REJECTED' | 'PROVIDER_UNAVAILABLE';
}>;

export interface EmailDeliveryPort {
  deliver(message: EmailDeliveryMessage): Promise<EmailDeliveryResult>;
}

/** Local mailbox captures whole messages only in memory and redacts inspection. */
export class LocalEmailDelivery implements EmailDeliveryPort {
  readonly #messages: EmailDeliveryMessage[] = [];

  async deliver(message: EmailDeliveryMessage): Promise<EmailDeliveryResult> {
    this.#messages.push(Object.freeze({ ...message }));
    return Object.freeze({ status: 'DELIVERED', providerReference: null, reasonCode: 'ACCEPTED' });
  }

  takeLatestForTest(): EmailDeliveryMessage | null { return this.#messages.at(-1) ?? null; }

  toJSON(): Readonly<{ adapter: 'local'; captured: number; messages: '[REDACTED]' }> {
    return Object.freeze({ adapter: 'local', captured: this.#messages.length, messages: '[REDACTED]' });
  }
}

type FetchLike = (input: string, init: RequestInit) => Promise<Readonly<{ ok: boolean; json(): Promise<unknown> }>>;

export class ResendEmailDelivery implements EmailDeliveryPort {
  readonly #apiKey: string;
  constructor(apiKey: string, private readonly sender: string, private readonly fetcher: FetchLike = fetch) {
    if (!/^re_[A-Za-z0-9_-]{16,}$/u.test(apiKey) || sender !== 'SR Taller <no-reply@srtaller.com>') throw new Error('Resend email delivery configuration is invalid.');
    this.#apiKey = apiKey;
  }

  async deliver(message: EmailDeliveryMessage): Promise<EmailDeliveryResult> {
    const invitation = message.templateKey === 'admin-invitation';
    const subject = invitation ? 'Invitación a SR Taller' : 'Verifica tu registro en SR Taller';
    const label = invitation ? 'Aceptar invitación' : 'Verificar correo';
    const lead = invitation ? 'Te invitaron a administrar un tenant en SR Taller.' : 'Confirma tu registro en SR Taller.';
    try {
      const response = await this.fetcher('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${this.#apiKey}`, 'content-type': 'application/json', 'idempotency-key': message.deliveryId },
        body: JSON.stringify({ from: this.sender, to: [message.destination], subject, html: `<p>${lead}</p><p><a href="${message.actionUrl}">${label}</a></p><p>Este enlace vence en ${invitation ? '24 horas' : '60 minutos'}.</p>` }),
      });
      if (!response.ok) return Object.freeze({ status: 'FAILED', providerReference: null, reasonCode: 'PROVIDER_REJECTED' });
      const body = await response.json();
      const reference = typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string' ? body.id.slice(0, 160) : null;
      return Object.freeze({ status: 'DELIVERED', providerReference: reference, reasonCode: 'ACCEPTED' });
    } catch {
      return Object.freeze({ status: 'FAILED', providerReference: null, reasonCode: 'PROVIDER_UNAVAILABLE' });
    }
  }

  toJSON(): Readonly<{ adapter: 'resend'; sender: string; apiKey: '[REDACTED]' }> {
    return Object.freeze({ adapter: 'resend', sender: this.sender, apiKey: '[REDACTED]' });
  }

  [inspect.custom](): ReturnType<ResendEmailDelivery['toJSON']> { return this.toJSON(); }
}
