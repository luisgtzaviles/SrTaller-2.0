import type { EmailDeliveryPort, EmailDeliveryResult, EmailDeliveryMessage } from '../../../../infrastructure/email/email-delivery.js';

export type RegistrationEmailMessage = Omit<EmailDeliveryMessage, 'templateKey' | 'actionUrl'> & Readonly<{
  templateKey: 'registration-verification';
  verificationUrl: string;
}>;
export type RegistrationEmailDeliveryResult = EmailDeliveryResult;
export interface RegistrationEmailDeliveryPort extends Omit<EmailDeliveryPort, 'deliver'> {
  deliver(message: RegistrationEmailMessage): Promise<RegistrationEmailDeliveryResult>;
}
