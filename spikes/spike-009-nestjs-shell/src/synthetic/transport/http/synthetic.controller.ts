import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ExecuteSyntheticOperation } from '../../application/execute-synthetic-operation.js';
import type { OperationalContextAuthority } from '../../application/ports.js';
import { TOKENS } from '../../../bootstrap/tokens.js';
import { ExecuteSyntheticDto } from './execute-synthetic.dto.js';
import { singleHeader, type SyntheticHttpRequest } from './http-types.js';
import { TechnicalAuthenticationGuard } from './technical-authentication.guard.js';

@Controller('synthetic/records')
@UseGuards(TechnicalAuthenticationGuard)
export class SyntheticController {
  constructor(
    @Inject(TOKENS.authority) private readonly authority: OperationalContextAuthority,
    @Inject(TOKENS.operation) private readonly operation: ExecuteSyntheticOperation,
  ) {}

  @Post(':recordId')
  async execute(
    @Param('recordId') recordId: string,
    @Body() body: ExecuteSyntheticDto,
    @Req() request: SyntheticHttpRequest,
  ) {
    if (!/^[a-z0-9-]{3,64}$/.test(recordId)) throw new BadRequestException();
    if (!request.syntheticIdentity || !request.serverCorrelationId) throw new BadRequestException();
    const context = this.authority.resolveContext(
      request.syntheticIdentity,
      singleHeader(request.headers, 'x-spike-station'),
      request.serverCorrelationId,
    );
    return this.operation.execute(context, {
      recordId,
      nextValue: body.nextValue,
      ...(body.simulateFailure === undefined ? {} : { simulateFailure: body.simulateFailure }),
    });
  }
}
