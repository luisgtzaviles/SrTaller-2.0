import { Module } from '@nestjs/common';

import { TechnicalShellService } from './technical-shell.service.js';

@Module({
  providers: [TechnicalShellService],
})
export class AppModule {}
