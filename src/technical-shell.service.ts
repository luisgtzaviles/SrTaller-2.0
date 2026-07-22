import { Injectable } from '@nestjs/common';

@Injectable()
export class TechnicalShellService {
  public readonly state = 'ready';
}
