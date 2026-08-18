import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthReadiness {
  #ready = false;

  isReady(): boolean {
    return this.#ready;
  }

  markReady(): void {
    this.#ready = true;
  }
}
