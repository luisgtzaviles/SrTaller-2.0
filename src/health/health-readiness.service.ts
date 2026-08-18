import { Injectable } from '@nestjs/common';

export interface HealthReadinessDependency {
  checkReady(): Promise<boolean>;
}

@Injectable()
export class HealthReadiness {
  #bootstrapReady = false;
  #dependency: HealthReadinessDependency | null = null;

  attachDependency(dependency: HealthReadinessDependency): void {
    if (this.#dependency) {
      throw new Error('Readiness dependency is already attached');
    }
    this.#dependency = dependency;
  }

  async isReady(): Promise<boolean> {
    return (
      this.#bootstrapReady &&
      this.#dependency !== null &&
      (await this.#dependency.checkReady())
    );
  }

  markReady(): void {
    this.#bootstrapReady = true;
  }

  markNotReady(): void {
    this.#bootstrapReady = false;
  }
}
