import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@shared/config/config.module";
import { ConfigService } from "@shared/config/config.service";
import { User, UserSchema } from "../user/schemas/user.schema";
import { InternalUser, InternalUserSchema } from "../admin/schemas/internal-user.schema";
import { JwtStrategy } from "./jwt-startegy/jwt.strategy";
import { EntraJwtStrategy } from "./jwt-startegy/entra-jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt.guard";
import { EntraJwtAuthGuard } from "./guards/entra-jwt.guard";
import { UnifiedAuthGuard } from "./guards/unified-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { ApiKeyGuard } from "./guards/api-key.guard";
import { EntraService } from "./entra.service";

/**
 * AuthModule - OAuth 2.0 / SSO Authentication Module
 *
 * Supports THREE authentication methods:
 * 1. Internal JWT (for admins) - MongoDB + bcrypt
 * 2. Entra ID SSO (for external users) - OAuth 2.0 / OpenID Connect
 *
 * For SSO users:
 * - Frontend uses MSAL (Entra) to get JWT
 * - Backend validates JWT using EntraJwtStrategy
 * - Passwords NEVER touch this backend
 *
 * RefreshTokenRepository and related schemas are NO LONGER needed
 * as SSO providers handle token refresh automatically.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getJwtSecret(),
        signOptions: {
          issuer: cfg.getJwtIssuer(),
          audience: cfg.getJwtAudience(),
          expiresIn: "1h",
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: InternalUser.name, schema: InternalUserSchema },
    ]),
  ],
  providers: [
    EntraService,
    JwtStrategy,
    EntraJwtStrategy,
    JwtAuthGuard,
    EntraJwtAuthGuard,
    UnifiedAuthGuard,
    RolesGuard,
    ApiKeyGuard,
  ],
  exports: [
    PassportModule,
    JwtModule,
    EntraService,
    JwtAuthGuard,
    EntraJwtAuthGuard,
    UnifiedAuthGuard,
    RolesGuard,
    ApiKeyGuard,
  ],
})
export class AuthModule {}
