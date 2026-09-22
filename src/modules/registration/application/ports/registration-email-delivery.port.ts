export type RegistrationEmailMessage = Readonly<{
  deliveryId: string;
  destination: string;
  templateKey: 'registration-verification';
  templateVersion: 1;
  verificationUrl: string;
  expiresAt: string;
}>;

export type RegistrationEmailDeliveryResult = Readonly<{
  status: 'DELIVERED' | 'FAILED';
  providerReference: string | null;
  reasonCode: 'ACCEPTED' | 'PROVIDER_REJECTED' | 'PROVIDER_UNAVAILABLE';
}>;

export interface RegistrationEmailDeliveryPort {
  deliver(message: RegistrationEmailMessage): Promise<RegistrationEmailDeliveryResult>;
}
