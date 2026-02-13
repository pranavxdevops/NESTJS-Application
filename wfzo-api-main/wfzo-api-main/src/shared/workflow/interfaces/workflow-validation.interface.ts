/**
 * Generic context for workflow validation
 * Can be extended by specific workflow validators
 */
export interface BaseValidationContext<TEntity = any, TTransition = any> {
  entity: TEntity; // The entity being validated (member, event, etc.)
  currentStatus: string; // Current status of the entity
  transition?: TTransition; // Transition information loaded from database
}

/**
 * Result of workflow validation
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Chain of Responsibility interface for workflow validators
 * Implement this for reusable validation logic
 */
export interface IWorkflowValidator<
  TContext extends BaseValidationContext = BaseValidationContext,
> {
  /**
   * Set the next validator in the chain
   */
  setNext(validator: IWorkflowValidator<TContext>): IWorkflowValidator<TContext>;

  /**
   * Validate and continue chain if successful
   */
  validate(context: TContext): Promise<ValidationResult>;
}
