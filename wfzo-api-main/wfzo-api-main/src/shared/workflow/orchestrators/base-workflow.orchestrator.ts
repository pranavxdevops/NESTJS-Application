import { Logger } from "@nestjs/common";
import { IBaseWorkflowOrchestrator } from "../interfaces/base-workflow.interface";
import { WorkflowTransitionRepository } from "@modules/masterdata/repository/workflow-transition.repository";
import { WorkflowType } from "@modules/masterdata/schemas/workflow-transition.schema";

/**
 * Abstract base class for workflow orchestrators
 * Provides common workflow coordination patterns
 *
 * Usage:
 * 1. Extend this class for your specific workflow
 * 2. Pass workflowType in constructor
 * 3. Inject workflow-specific handlers
 * 4. Use getCurrentPhase() to get entity's current workflow phase
 *
 * @example
 * ```typescript
 * class MemberWorkflowOrchestrator extends BaseWorkflowOrchestrator<Member, MemberPhase> {
 *   constructor(
 *     private readonly phase1Handler: Phase1Handler,
 *     workflowTransitionRepository: WorkflowTransitionRepository,
 *   ) {
 *     super(WorkflowType.MEMBER_ONBOARDING, MemberWorkflowOrchestrator.name, workflowTransitionRepository);
 *   }
 *
 *   async executePhase1(data: CreateMemberDto): Promise<WorkflowResult> {
 *     return this.phase1Handler.handle({ phase: MemberPhase.PHASE_1, data });
 *   }
 * }
 * ```
 */
export abstract class BaseWorkflowOrchestrator<TEntity = any, TPhase extends string = string>
  implements IBaseWorkflowOrchestrator<TEntity, TPhase>
{
  protected readonly logger: Logger;

  constructor(
    protected readonly workflowType: WorkflowType,
    loggerName: string,
    protected readonly workflowTransitionRepository: WorkflowTransitionRepository,
  ) {
    this.logger = new Logger(loggerName);
  }

  /**
   * Get current workflow phase based on entity status (Database-Driven)
   * Loads the workflow phase from the database transition configuration
   */
  async getCurrentPhase(entity: TEntity): Promise<TPhase | null> {
    const status = this.getEntityStatus(entity);
    const transition = await this.workflowTransitionRepository.getTransition(
      this.workflowType,
      status,
    );

    if (!transition) {
      this.logger.warn(
        `No workflow transition found for status: ${status}. This may be a terminal state.`,
      );
      return null;
    }

    // Database stores phase enum values directly
    return transition.phase as TPhase;
  }

  /**
   * Get phase from current status (Database-Driven)
   * Useful for determining which handler to use
   */
  protected async getPhaseFromStatus(currentStatus: string): Promise<TPhase> {
    const transition = await this.workflowTransitionRepository.getTransition(
      this.workflowType,
      currentStatus,
    );

    if (!transition) {
      throw new Error(
        `Cannot determine phase for status: ${currentStatus}. No valid workflow transition found.`,
      );
    }

    return transition.phase as TPhase;
  }

  /**
   * Implement this to extract status from your entity
   * @example
   * ```typescript
   * protected getEntityStatus(entity: Member): string {
   *   return entity.status;
   * }
   * ```
   */
  protected abstract getEntityStatus(entity: TEntity): string;
}
