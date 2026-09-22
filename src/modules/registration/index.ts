import type { AccessModuleContract } from '../access/index.js';

export interface RegistrationModuleContract {
  readonly module: 'registration';
  readonly access: AccessModuleContract;
}
