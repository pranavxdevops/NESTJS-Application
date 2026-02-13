import { Injectable, ExecutionContext, UnauthorizedException, Logger, CanActivate } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * UnifiedAuthGuard - Accepts JWT tokens from Microsoft Entra ID
 *
 * This guard tries to validate tokens against both authentication providers.
 * It's useful when you want to support multiple auth providers on the same endpoint.
 *
 * Order of validation:
 * 1. Try Entra ID first (for external SSO users)
 *
 * Usage:
 * @UseGuards(UnifiedAuthGuard)
 * async someEndpoint(@Request() req) {
 *   // req.user will contain user data from whichever provider succeeded
 *   console.log(req.user.email);
 * }
 *
 * Note: The user object structure is normalized across both providers.
 */
@Injectable()
export class UnifiedAuthGuard implements CanActivate {
  private readonly logger = new Logger(UnifiedAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn("No authorization token provided");
      throw new UnauthorizedException("Authorization token is required");
    }

    this.logger.log(`🔍 Validating token (length: ${token.length}, preview: ${token.substring(0, 50)}...)`);

    // Try Entra JWT first (for Microsoft SSO users)
    try {
      this.logger.log("🔐 Attempting Entra ID validation...");
      const entraGuard = new (AuthGuard("entra-jwt"))();
      const canActivate = await entraGuard.canActivate(context);
      
      if (canActivate) {
        this.logger.log("✅ Token validated via Entra ID");
        return true;
      }
    } catch (entraError) {
      const errorMessage = entraError instanceof Error ? entraError.message : String(entraError);
      this.logger.warn(`❌ Entra validation failed: ${errorMessage}`);
      this.logger.debug(`Entra error details: ${JSON.stringify(entraError)}`);
    }

    // Both providers failed
    this.logger.warn("Token validation failed for Entra");
    throw new UnauthorizedException("Invalid or expired authentication token");
  }

  /**
   * Extract bearer token from Authorization header
   */
  private extractToken(request: any): string | null {
    const authHeader = request.headers?.authorization;
    
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(" ");
    
    if (type !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
