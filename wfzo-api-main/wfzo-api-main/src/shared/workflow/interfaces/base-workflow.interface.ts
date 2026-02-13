/**
 * Generic workflow context
 * Can be extended by specific workflow implementations
 */
export interface BaseWorkflowContext<TData = any, TMetadata = any> {
  phase: string; // Workflow phase identifier
  entityId?: string; // Entity being processed (memberId, eventId, etc.)
  data: TData; // Phase-specific data
  metadata?: TMetadata; // Additional context
}

/**
 * Generic workflow result
 * Can be extended by specific workflow implementations
 */
export interface BaseWorkflowResult<TEntity = any> {
  success: boolean;
  entity: TEntity; // The processed entity (member, event, etc.)
  phase: string; // Current phase
  nextPhase?: string; // Next phase if available
  message?: string;
  error?: string;
}

/**
 * Base interface for all workflow handlers
 * Implement this for each phase of your workflow
 */
export interface IBaseWorkflowHandler<
  TContext extends BaseWorkflowContext = BaseWorkflowContext,
  TResult extends BaseWorkflowResult = BaseWorkflowResult,
> {
  /**
   * Handle the workflow phase
   */
  handle(context: TContext): Promise<TResult>;

  /**
   * Validate if the phase can be executed
   */
  canHandle(context: TContext): boolean;

  /**
   * Get the phase this handler manages
   */
  getPhase(): string;
}

/**
 * Base interface for workflow orchestrator
 * Coordinates handlers and manages workflow execution
 */
export interface IBaseWorkflowOrchestrator<TEntity = any, TPhase extends string = string> {
  /**
   * Get current workflow phase for an entity (Database-Driven)
   * Returns null if entity is in a terminal state
   */
  getCurrentPhase(entity: TEntity): Promise<TPhase | null>;
}
