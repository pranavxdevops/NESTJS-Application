import {
  IWorkflowValidator,
  BaseValidationContext,
} from "../interfaces/workflow-validation.interface";

/**
 * Generic Validator Chain Builder
 * Uses Chain of Responsibility pattern to link validators
 *
 * This is a utility class that can be used by any workflow to build
 * validation chains without needing a custom factory class.
 *
 * @example
 * ```typescript
 * // In your orchestrator or handler
 * const validator = ValidatorChainBuilder.create(
 *   validator1,
 *   validator2,
 *   validator3
 * );
 *
 * const result = await validator.validate(context);
 * ```
 */
export class ValidatorChainBuilder {
  /**
   * Creates a validation chain from multiple validators
   * Validators are chained in the order they are provided
   *
   * @param validators - Validators to chain (in execution order)
   * @returns The first validator in the chain
   */
  static create<TContext extends BaseValidationContext>(
    ...validators: IWorkflowValidator<TContext>[]
  ): IWorkflowValidator<TContext> {
    if (validators.length === 0) {
      throw new Error("At least one validator is required to create a chain");
    }

    // Chain validators together
    for (let i = 0; i < validators.length - 1; i++) {
      validators[i].setNext(validators[i + 1]);
    }

    // Return the first validator (head of the chain)
    return validators[0];
  }

  /**
   * Creates a validation chain and executes it immediately
   *
   * @param context - The validation context
   * @param validators - Validators to chain and execute
   * @returns Validation result
   */
  static async validate<TContext extends BaseValidationContext>(
    context: TContext,
    ...validators: IWorkflowValidator<TContext>[]
  ) {
    const chain = ValidatorChainBuilder.create(...validators);
    return chain.validate(context);
  }
}
