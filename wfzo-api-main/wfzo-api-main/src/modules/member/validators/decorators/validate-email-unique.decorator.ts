import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import mongoose, { Model } from "mongoose";
import { User } from "@modules/user/schemas/user.schema";

/**
 * Global connection for accessing User model
 */
let globalUserConnection: mongoose.Connection | null = null;

export function setGlobalUserConnection(connection: mongoose.Connection) {
  globalUserConnection = connection;
}

/**
 * Validator that checks if an email is unique across all users
 */
@ValidatorConstraint({ name: "validateEmailUnique", async: true })
export class ValidateEmailUniqueConstraint implements ValidatorConstraintInterface {
  async validate(email: any, args: ValidationArguments): Promise<boolean> {
    if (!email || typeof email !== "string") {
      return true; // Let @IsEmail handle format validation
    }

    console.log(`[ValidateEmailUnique] Validating email: ${email}`);

    try {
      const userModel = await this.getUserModel();

      if (!userModel) {
        console.error("[ValidateEmailUnique] User model not available");
        return false;
      }

      // Get the user ID from the parent object if this is an update
      const parent = args.object as any;
      const userId = parent.id;

      const filter: Record<string, unknown> = {
        email: email.toLowerCase(),
        deletedAt: null,
      };

      // Exclude current user when updating
      if (userId) {
        filter._id = { $ne: userId };
      }

      const existingUser = await userModel.findOne(filter).lean().exec();
      const isUnique = !existingUser;

      console.log(`[ValidateEmailUnique] Email "${email}": ${isUnique ? "UNIQUE" : "DUPLICATE"}`);
      return isUnique;
    } catch (error) {
      console.error(`[ValidateEmailUnique] Error validating email:`, error);
      return false;
    }
  }

  private async getUserModel(): Promise<Model<User> | null> {
    try {
      if (!globalUserConnection) {
        return null;
      }

      // Check if model is registered
      if (globalUserConnection.models["User"]) {
        return globalUserConnection.models["User"] as Model<User>;
      }

      return null;
    } catch (error) {
      console.error("[ValidateEmailUnique] Error getting User model:", error);
      return null;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const email = args.value as string;

    // Mask email
    const [username, domain] = email.split("@");
    const masked = `${username.slice(0, 3)}**@${domain}`;

    return `Registration Already Exists!
    It looks like this email address is already registered.
    Registered Email: ${masked}
    Please contact membership@worldfzo.org for further assistance or next steps.`;
  }
}

/**
 * Decorator to validate that an email is unique
 */
export function ValidateEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateEmailUniqueConstraint,
    });
  };
}

/**
 * Validator that checks if email domain is unique for Primary users
 */
@ValidatorConstraint({ name: "validatePrimaryEmailDomain", async: true })
export class ValidatePrimaryEmailDomainConstraint implements ValidatorConstraintInterface {
  private existingEmail: string | null = null;
  async validate(email: any, args: ValidationArguments): Promise<boolean> {
    if (!email || typeof email !== "string") {
      return true; // Let @IsEmail handle format validation
    }

    // Only validate for Primary users
    const parent = args.object as any;
    if (parent.userType !== "Primary") {
      return true; // Skip validation for non-Primary users
    }

    console.log(`[ValidatePrimaryEmailDomain] Validating Primary user email domain: ${email}`);

    try {
      const userModel = await this.getUserModel();

      if (!userModel) {
        console.error("[ValidatePrimaryEmailDomain] User model not available");
        return false;
      }

      const domain = this.extractDomain(email);
      if (!domain) {
        console.error(`[ValidatePrimaryEmailDomain] Invalid email format: ${email}`);
        return false;
      }

      // Get the user ID from the parent object if this is an update
      const userId = parent.id;

      // Build regex to match all emails with this domain
      const domainRegex = new RegExp(`@${domain.replace(".", "\\.")}$`, "i");

      const filter: Record<string, unknown> = {
        email: { $regex: domainRegex },
        userType: "Primary",
        deletedAt: null,
      };

      // Exclude current user when updating
      if (userId) {
        filter._id = { $ne: userId };
      }

      const existingPrimaryUser = await userModel.findOne(filter).lean().exec();
      if (existingPrimaryUser) {
        this.existingEmail = existingPrimaryUser.email;
      }
      const isDomainUnique = !existingPrimaryUser;

      console.log(
        `[ValidatePrimaryEmailDomain] Domain "@${domain}" for Primary user: ${isDomainUnique ? "UNIQUE" : "DUPLICATE"}`
      );
      return isDomainUnique;
    } catch (error) {
      console.error(`[ValidatePrimaryEmailDomain] Error validating email domain:`, error);
      return false;
    }
  }

  private async getUserModel(): Promise<Model<User> | null> {
    try {
      if (!globalUserConnection) {
        return null;
      }

      // Check if model is registered
      if (globalUserConnection.models["User"]) {
        return globalUserConnection.models["User"] as Model<User>;
      }

      return null;
    } catch (error) {
      console.error("[ValidatePrimaryEmailDomain] Error getting User model:", error);
      return null;
    }
  }

  private extractDomain(email: string): string | null {
    const match = email.match(/@(.+)$/);
    return match ? match[1].toLowerCase() : null;
  }

  defaultMessage(args: ValidationArguments) {
    const existingUserEmail = this.existingEmail || 'unknown';
    const maskEmail = (email: string) => {
      const [local, domain] = email.split("@");

      // Take the first 3 characters of the local part, then add **
      const maskedLocal = local.slice(0, 3) + "**";

      return maskedLocal + "@" + domain;
    };

    return `Registration Already Exists!
    It looks like someone from your organization has already registered using this email domain.
    Registered Email: ${maskEmail(existingUserEmail)}.Please contact membership@worldfzo.org for further assistance or next steps.`;
  }
}

/**
 * Decorator to validate that email domain is unique for Primary users
 */
export function ValidatePrimaryEmailDomain(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidatePrimaryEmailDomainConstraint,
    });
  };
}
