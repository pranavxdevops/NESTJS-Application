import {
  IWorkflowValidator,
  BaseValidationContext,
  ValidationResult,
} from "../interfaces/workflow-validation.interface";

/**
 * Abstract base class for workflow validators
 * Implements Chain of Responsibility pattern
 *
 * Usage:
 * 1. Extend this class
 * 2. Implement doValidate() with your validation logic
 * 3. Chain validators using setNext()
 *
 * @example
 * ```typescript
 * class MyValidator extends BaseValidator<MyContext> {
 *   protected async doValidate(context: MyContext): Promise<ValidationResult> {
 *     if (!context.entity.isValid) {
 *       return { isValid: false, error: 'Entity is invalid' };
 *     }
 *     return { isValid: true };
 *   }
 * }
 *
 * const validator1 = new MyValidator();
 * const validator2 = new AnotherValidator();
 * validator1.setNext(validator2);
 * ```
 */
export abstract class BaseValidator<TContext extends BaseValidationContext = BaseValidationContext>
  implements IWorkflowValidator<TContext>
{
  private nextValidator?: IWorkflowValidator<TContext>;

  setNext(validator: IWorkflowValidator<TContext>): IWorkflowValidator<TContext> {
    this.nextValidator = validator;
    return validator;
  }

  async validate(context: TContext): Promise<ValidationResult> {
    // Execute this validator's logic
    const result = await this.doValidate(context);

    // If validation fails, stop the chain
    if (!result.isValid) {
      return result;
    }

    // If validation passes and there's a next validator, continue the chain
    if (this.nextValidator) {
      return this.nextValidator.validate(context);
    }

    // All validations passed
    return { isValid: true };
  }

  /**
   * Implement specific validation logic in subclasses
   * Return { isValid: false, error: 'message' } to stop the chain
   * Return { isValid: true } to continue to next validator
   */
  protected abstract doValidate(context: TContext): Promise<ValidationResult>;
}
