import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ErrorCatalogService } from "./error-catalog.service";
import { ErrorCode } from "./error-codes.enum";

interface ErrorResponse {
  code: string;
  message: string;
  errors?: Array<{
    field?: string;
    constraints?: Record<string, string>;
    message: string;
  }>;
  details?: Record<string, unknown>;
  timestamp: string;
  path?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly catalog: ErrorCatalogService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let code = ErrorCode.INTERNAL;
    let message = this.catalog.getMessage(code) ?? "Internal server error";
    let errors: ErrorResponse["errors"] | undefined;
    let details: ErrorResponse["details"] | undefined;

    if (exception instanceof BadRequestException) {
      status = 400;
      code = ErrorCode.VALIDATION;
      const r = exception.getResponse() as {
        message?:
          | string
          | string[]
          | Array<{
              property?: string;
              constraints?: Record<string, string>;
              children?: unknown[];
            }>;
        error?: string;
      };

      // Enhanced validation error handling
      if (Array.isArray(r.message)) {
        // Check if it's detailed validation errors (from class-validator)
        const firstItem = r.message[0];
        if (typeof firstItem === "object" && firstItem !== null && "property" in firstItem) {
          // Detailed validation errors with constraints
          errors = (
            r.message as Array<{ property?: string; constraints?: Record<string, string> }>
          ).map((err) => ({
            field: err.property,
            constraints: err.constraints,
            message: err.constraints ? Object.values(err.constraints)[0] : "Validation failed",
          }));
          message = `Validation failed: ${errors.map((e) => `${e.field} - ${e.message}`).join(", ")}`;

          // Log detailed validation errors
          this.logger.error(
            `Validation failed with ${errors.length} error(s): ${JSON.stringify(errors, null, 2)}`,
          );
        } else if (typeof firstItem === "string") {
          // Simple string array messages
          message = (r.message as string[]).join(", ");
          this.logger.error(`Validation failed: ${message}`);
        }
      } else if (typeof r.message === "string") {
        message = r.message;
        this.logger.error(`Validation failed: ${message}`);
      } else {
        message = this.catalog.getMessage(code) ?? "Validation failed";
        this.logger.error(`Validation failed: ${JSON.stringify(r)}`);
      }
    } else if (exception instanceof NotFoundException) {
      status = 404;
      code = ErrorCode.NOT_FOUND;
      const resp = exception.getResponse();
      message =
        typeof resp === "object" && "message" in resp && typeof resp.message === "string"
          ? resp.message
          : exception.message || this.catalog.getMessage(code) || "Not found";

      this.logger.warn(`Not found: ${message} - Path: ${request.url}`);
    } else if (exception instanceof ForbiddenException) {
      status = 403;
      code = ErrorCode.FORBIDDEN;
      message = exception.message || this.catalog.getMessage(code) || "Forbidden";

      this.logger.warn(`Forbidden: ${message} - Path: ${request.url}`);
    } else if (exception instanceof UnauthorizedException) {
      status = 401;
      code = ErrorCode.UNAUTHORIZED;
      message = exception.message || this.catalog.getMessage(code) || "Unauthorized";

      this.logger.warn(`Unauthorized: ${message} - Path: ${request.url}`);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();

      if (resp && typeof resp === "object") {
        // Extract message from response
        if ("message" in resp) {
          const m = (resp as { message?: string | string[] }).message;
          message = Array.isArray(m) ? m.join(", ") : (m ?? exception.message);
        } else {
          message = exception.message;
        }

        // Extract additional details (ignoring standard error fields)
        const respObj = resp as Record<string, unknown>;
        const standardFields = new Set(["message", "error", "statusCode"]);
        const restDetails = Object.keys(respObj).reduce(
          (acc, key) => {
            if (!standardFields.has(key)) {
              acc[key] = respObj[key];
            }
            return acc;
          },
          {} as Record<string, unknown>,
        );

        if (Object.keys(restDetails).length > 0) {
          details = restDetails;
        }
      } else {
        message = exception.message;
      }

      this.logger.error(
        `HTTP Exception [${status}]: ${message}${details ? ` - Details: ${JSON.stringify(details)}` : ""}`,
      );
    } else {
      // Unhandled exception - log full error with stack trace
      const error = exception as Error;
      message = error.message || "An unexpected error occurred";

      this.logger.error(`Unhandled exception: ${message}`, error.stack);

      // Include error details in development/staging (not production)
      if (process.env.NODE_ENV !== "production") {
        details = {
          name: error.name,
          stack: error.stack?.split("\n").slice(0, 5), // First 5 lines of stack
        };
      }
    }

    const errorResponse: ErrorResponse = {
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (errors && errors.length > 0) {
      errorResponse.errors = errors;
    }

    if (details) {
      errorResponse.details = details;
    }

    response.status(status).json(errorResponse);
  }
}
