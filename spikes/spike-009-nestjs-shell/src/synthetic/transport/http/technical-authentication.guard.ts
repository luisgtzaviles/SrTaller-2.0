import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { OperationalContextAuthority } from '../../application/ports.js';
import { TOKENS } from '../../../bootstrap/tokens.js';
import { singleHeader, type SyntheticHttpRequest } from './http-types.js';

@Injectable()
export class TechnicalAuthenticationGuard implements CanActivate {
  constructor(@Inject(TOKENS.authority) private readonly authority: OperationalContextAuthority) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<SyntheticHttpRequest>();
    request.syntheticIdentity = this.authority.authenticate(
      singleHeader(request.headers, 'x-spike-credential'),
    );
    return true;
  }
}
