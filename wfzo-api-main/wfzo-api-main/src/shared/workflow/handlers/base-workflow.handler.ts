import { Logger } from "@nestjs/common";
import {
  IBaseWorkflowHandler,
  BaseWorkflowContext,
  BaseWorkflowResult,
} from "../interfaces/base-workflow.interface";

/**
 * Abstract base class for workflow handlers
 * Provides common lifecycle methods and logging
 *
 * Usage:
 * 1. Extend this class for each workflow phase
 * 2. Implement execute() with phase-specific logic
 * 3. Override canHandle() if you need custom validation
 * 4. Call getPhase() to identify the handler
 *
 * @example
 * ```typescript
 * class ApplicationHandler extends BaseWorkflowHandler<AppContext, AppResult> {
 *   constructor() {
 *     super('APPLICATION_PHASE', ApplicationHandler.name);
 *   }
 *
 *   async execute(context: AppContext): Promise<AppResult> {
 *     // Your phase logic here
 *     return { success: true, entity: {...}, phase: this.phase };
 *   }
 * }
 * ```
 */
export abstract class BaseWorkflowHandler<
  TContext extends BaseWorkflowContext = BaseWorkflowContext,
  TResult extends BaseWorkflowResult = BaseWorkflowResult,
> implements IBaseWorkflowHandler<TContext, TResult>
{
  protected readonly logger: Logger;

  constructor(
    protected readonly phase: string,
    loggerName: string,
  ) {
    this.logger = new Logger(loggerName);
  }

  getPhase(): string {
    return this.phase;
  }

  canHandle(context: TContext): boolean {
    return context.phase === this.phase;
  }

  async handle(context: TContext): Promise<TResult> {
    this.logger.log(`Handling phase: ${this.phase}`);

    try {
      const result = await this.execute(context);
      this.logger.log(`Successfully completed phase: ${this.phase}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in phase ${this.phase}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * Implement phase-specific execution logic in subclasses
   */
  protected abstract execute(context: TContext): Promise<TResult>;
}
