import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { getModelToken } from "@nestjs/mongoose";
import { Model, Connection } from "mongoose";
import { DropdownValue, DropdownValueSchema } from "@modules/masterdata/schemas/dropdown-value.schema";

/**
 * Global variable to store the mongoose connection
 * This will be set by NestJS during application bootstrap
 */
let globalConnection: Connection | null = null;

export function setGlobalConnection(connection: Connection) {
  globalConnection = connection;
}

/**
 * Validator that checks if a value exists in the dropdown values collection
 * Validates against active (non-deleted) dropdown values for the specified category
 */
@ValidatorConstraint({ name: "validateDropdownValue", async: true })
export class ValidateDropdownValueConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    console.log(`[ValidateDropdownValue] Validating value: ${value}, category: ${args.constraints[0]}`);
    
    if (!value) {
      return true; // Let @IsOptional or @IsNotEmpty handle required validation
    }

    const [category] = args.constraints;
    if (!category) {
      console.error('[ValidateDropdownValue] No category provided!');
      return false;
    }

    try {
      // Get the model from the validation context
      const object = args.object as any;
      const dropdownValueModel = await this.getModel(object);

      if (!dropdownValueModel) {
        console.error('[ValidateDropdownValue] Model not available!');
        return false;
      }

      // Check if the value exists in dropdown values for this category
      const dropdownValue = await dropdownValueModel
        .findOne({
          category,
          code: value,
          deletedAt: null, // Only active values
        })
        .lean()
        .exec();

      const isValid = !!dropdownValue;
      console.log(`[ValidateDropdownValue] Value "${value}" for category "${category}": ${isValid ? 'VALID' : 'INVALID'}`);
      return isValid;
    } catch (error) {
      console.error(`[ValidateDropdownValue] Error validating dropdown value for category ${category}:`, error);
      return false; // Return false to fail validation instead of throwing
    }
  }

  private async getModel(object: any): Promise<Model<DropdownValue> | null> {
    try {
      if (!globalConnection) {
        console.error('[ValidateDropdownValue] Global connection not set');
        return null;
      }

      // Debug: Log available models
      console.log('[ValidateDropdownValue] Available models:', Object.keys(globalConnection.models));
      console.log('[ValidateDropdownValue] Connection state:', globalConnection.readyState);
      
      // Check if the model is already registered
      if (globalConnection.models['DropdownValue']) {
        console.log('[ValidateDropdownValue] Found DropdownValue');
        return globalConnection.models['DropdownValue'] as Model<DropdownValue>;
      }
      
      // Try alternative model name (singular/plural variations)
      if (globalConnection.models['dropdownValue']) {
        console.log('[ValidateDropdownValue] Found dropdownValue');
        return globalConnection.models['dropdownValue'] as Model<DropdownValue>;
      }
      
      // Register the model if not found
      try {
        console.log('[ValidateDropdownValue] Registering DropdownValue model');
        const model = globalConnection.model('DropdownValue', DropdownValueSchema) as Model<DropdownValue>;
        console.log('[ValidateDropdownValue] Successfully registered model');
        return model;
      } catch (error: any) {
        console.error('[ValidateDropdownValue] Failed to register model:', error?.message || error);
        return null;
      }
    } catch (error) {
      console.error('[ValidateDropdownValue] Error in getModel:', error);
      return null;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const [category] = args.constraints;
    return `${args.property} must be a valid ${category} value from the dropdown list`;
  }
}

/**
 * Decorator to validate that a field value exists in the dropdown values collection
 *
 * @param category - The dropdown category to validate against (e.g., 'membershipCategory', 'tier')
 * @param validationOptions - Optional class-validator options
 *
 * @example
 * ```typescript
 * @ValidateDropdownValue('membershipCategory')
 * category!: string;
 *
 * @ValidateDropdownValue('tier', { message: 'Invalid tier selected' })
 * tier?: string;
 * ```
 */
export function ValidateDropdownValue(
  category: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [category],
      validator: ValidateDropdownValueConstraint,
    });
  };
}

/**
 * Validator for array of dropdown values
 */
@ValidatorConstraint({ name: "validateDropdownValueArray", async: true })
export class ValidateDropdownValueArrayConstraint implements ValidatorConstraintInterface {
  async validate(values: any[], args: ValidationArguments): Promise<boolean> {
    if (!values || !Array.isArray(values) || values.length === 0) {
      return true; // Let other validators handle empty arrays
    }

    const [category] = args.constraints;
    if (!category) {
      console.error('ValidateDropdownValueArray decorator requires a category parameter');
      return false;
    }

    try {
      // Get the model from the validation context
      const object = args.object as any;
      const dropdownValueModel = await this.getModel(object);

      if (!dropdownValueModel) {
        console.error('DropdownValue model not available. Make sure MongoDB connection is established.');
        return false;
      }

      // Get all valid codes for this category
      const validValues = await dropdownValueModel
        .find({
          category,
          deletedAt: null,
        })
        .select("code")
        .lean()
        .exec();

      const validCodes = new Set(validValues.map((v) => v.code));

      // Check if all provided values are valid
      return values.every((value) => validCodes.has(value));
    } catch (error) {
      console.error(`Error validating dropdown value array for category ${category}:`, error);
      return false; // Return false to fail validation instead of throwing
    }
  }

  private async getModel(object: any): Promise<Model<DropdownValue> | null> {
    try {
      if (!globalConnection) {
        console.error('[ValidateDropdownValueArray] Global connection not set');
        return null;
      }

      // Debug: Log available models
      console.log('[ValidateDropdownValueArray] Available models:', Object.keys(globalConnection.models));
      console.log('[ValidateDropdownValueArray] Connection state:', globalConnection.readyState);
      
      // Check if the model is already registered
      if (globalConnection.models['DropdownValue']) {
        console.log('[ValidateDropdownValueArray] Found DropdownValue');
        return globalConnection.models['DropdownValue'] as Model<DropdownValue>;
      }
      
      // Try alternative model name (singular/plural variations)
      if (globalConnection.models['dropdownValue']) {
        console.log('[ValidateDropdownValueArray] Found dropdownValue');
        return globalConnection.models['dropdownValue'] as Model<DropdownValue>;
      }
      
      // Register the model if not found
      try {
        console.log('[ValidateDropdownValueArray] Registering DropdownValue model');
        const model = globalConnection.model('DropdownValue', DropdownValueSchema) as Model<DropdownValue>;
        console.log('[ValidateDropdownValueArray] Successfully registered model');
        return model;
      } catch (error: any) {
        console.error('[ValidateDropdownValueArray] Failed to register model:', error?.message || error);
        return null;
      }
    } catch (error) {
      console.error('[ValidateDropdownValueArray] Error in getModel:', error);
      return null;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const [category] = args.constraints;
    return `All ${args.property} values must be valid ${category} values from the dropdown list`;
  }
}

/**
 * Decorator to validate that all values in an array exist in the dropdown values collection
 *
 * @param category - The dropdown category to validate against
 * @param validationOptions - Optional class-validator options
 *
 * @example
 * ```typescript
 * @ValidateDropdownValueArray('industries')
 * @IsArray()
 * industries?: string[];
 * ```
 */
export function ValidateDropdownValueArray(
  category: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [category],
      validator: ValidateDropdownValueArrayConstraint,
    });
  };
}
