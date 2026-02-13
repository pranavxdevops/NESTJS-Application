import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from "@nestjs/common";
import { ConfigService } from "@shared/config/config.service";

/**
 * ApiKeyGuard - API Key authentication using bcrypt
 *
 * Validates the x-api-key header by hashing it with the configured secret
 * and comparing against the stored hash.
 *
 * Usage:
 * @UseGuards(ApiKeyGuard)
 * async someEndpoint() { ... }
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }
    

    const storedHash = this.config.getApiKey();

    if (!storedHash) {
      throw new UnauthorizedException('API key configuration is missing');
    }

    // Compare the provided API key with the stored hash
    const isValid = apiKey === storedHash;

    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}