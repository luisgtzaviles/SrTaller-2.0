import { randomUUID } from 'node:crypto';
import type { RepairClassificationContext, RepairProblemClassificationRecord, RepairRepositoryPort } from './ports/repair-repository.port.js';
export { RepairProblemClassificationAuthorizationChangedError, RepairProblemClassificationConflictError, RepairProblemClassificationNotFoundError } from './ports/repair-repository.port.js';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
export class RepairProblemClassificationInputError extends Error { constructor(readonly parameter: string) { super('Repair problem classification input is invalid.'); this.name = 'RepairProblemClassificationInputError'; } }
function id(value: unknown, parameter: string): string { if (typeof value !== 'string' || !uuid.test(value)) throw new RepairProblemClassificationInputError(parameter); return value; }
export class ChangeRepairProblemClassificationService {
  constructor(private readonly repository: RepairRepositoryPort, private readonly now: () => Date = () => new Date(), private readonly createId: () => string = randomUUID) {}
  add(context: RepairClassificationContext, repairId: unknown, categoryId: unknown): Promise<RepairProblemClassificationRecord> { return this.change(context, repairId, categoryId, 'repair.problem_category.assigned'); }
  remove(context: RepairClassificationContext, repairId: unknown, categoryId: unknown): Promise<RepairProblemClassificationRecord> { return this.change(context, repairId, categoryId, 'repair.problem_category.removed'); }
  private change(context: RepairClassificationContext, repairId: unknown, categoryId: unknown, action: 'repair.problem_category.assigned' | 'repair.problem_category.removed') { return this.repository.changeProblemClassification(context, { repairId: id(repairId, 'repairId'), categoryId: id(categoryId, 'categoryId'), problemCaptureId: id(this.createId(), 'problemCaptureId'), eventId: id(this.createId(), 'eventId'), timelineEntryId: id(this.createId(), 'timelineEntryId'), correlationId: id(this.createId(), 'correlationId'), action, occurredAt: this.now() }); }
}
