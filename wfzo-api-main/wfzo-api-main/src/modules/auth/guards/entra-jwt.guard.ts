import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * EntraJwtAuthGuard - Protects routes that require Entra ID JWT tokens
 *
 * Use this guard for external users (website members) who authenticate via Microsoft Entra ID.
 * The token must be issued by Entra ID and validated against Entra's public keys.
 *
 * Usage:
 * @UseGuards(EntraJwtAuthGuard)
 * async someEndpoint() { ... }
 */
@Injectable()
export class EntraJwtAuthGuard extends AuthGuard("entra-jwt") {}
