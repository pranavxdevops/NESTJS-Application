import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as jwksRsa from "jwks-rsa";
import { ConfigService } from "@nestjs/config";
import { User, UserDocument } from "@modules/user/schemas/user.schema";

/**
 * EntraJwtStrategy - Validates JWT tokens issued by Microsoft Entra ID
 *
 * This strategy validates tokens where Entra ID is the issuer:
 * - Fetches Entra's public keys from JWKS endpoint
 * - Verifies JWT signature against public keys
 * - Validates issuer, audience, expiration
 * - Ensures user exists and is active in MongoDB
 *
 * Flow:
 * 1. Frontend gets token from Entra ID (via OAuth 2.0 / MSAL)
 * 2. Frontend sends token to backend in Authorization header
 * 3. This strategy validates token signature with Entra's public keys
 * 4. User data loaded from MongoDB and attached to request
 */
@Injectable()
export class EntraJwtStrategy extends PassportStrategy(Strategy, "entra-jwt") {
  private readonly logger = new Logger(EntraJwtStrategy.name);
  private readonly jwksClient: jwksRsa.JwksClient;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    const isExternalId = configService.get<string>("ENTRA_TYPE") === "external";
    
    // Different config for External ID (B2C) vs standard Entra ID
    let jwksUri: string;
    let issuer: string;
    let clientId: string;

    if (isExternalId) {
      // Entra External ID (CIAM) configuration
      const tenantName = configService.get<string>("ENTRA_EXTERNAL_TENANT_NAME")!;
      const tenantId = configService.get<string>("ENTRA_EXTERNAL_TENANT_ID")!;
      clientId = configService.get<string>("ENTRA_EXTERNAL_CLIENT_ID")!;

      // External ID uses ciamlogin.com instead of b2clogin.com
      // External ID can issue tokens with either tenant name or tenant ID in the issuer
      jwksUri = `https://${tenantName}.ciamlogin.com/${tenantId}/discovery/v2.0/keys`;
      issuer = `https://${tenantId}.ciamlogin.com/${tenantId}/v2.0`; // Use tenant ID format to match token
    } else {
      // Standard Entra ID configuration
      const tenantId = configService.get<string>("ENTRA_TENANT_ID")!;
      clientId = configService.get<string>("ENTRA_CLIENT_ID")!;

      jwksUri = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;
      issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    }

    // Initialize JWKS client to fetch Entra's public keys
    const jwksClient = new jwksRsa.JwksClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      cacheMaxEntries: 5,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use secretOrKeyProvider to dynamically fetch public key based on kid
      secretOrKeyProvider: (
        request: any,
        rawJwtToken: string,
        done: (err: any, key?: string) => void,
      ) => {
        try {
          const header = JSON.parse(
            Buffer.from(rawJwtToken.split(".")[0], "base64").toString(),
          ) as { kid: string };

          jwksClient.getSigningKey(header.kid, (err, key) => {
            if (err) {
              return done(err);
            }
            const signingKey = key?.getPublicKey();
            done(null, signingKey);
          });
        } catch (error) {
          done(error);
        }
      },
      // Validate issuer and audience
      issuer,
      audience: clientId, // Must match the client ID in Azure app registration
      algorithms: ["RS256"],
    });

    this.jwksClient = jwksClient;
    this.logger.log(`✅ Entra JWT Strategy initialized (${isExternalId ? 'External ID' : 'Standard Entra ID'})`);
    this.logger.log(`🔐 JWKS URI: ${jwksUri}`);
    this.logger.log(`🔐 Issuer: ${issuer}`);
    this.logger.log(`🔐 Client ID (Audience): ${clientId}`);
  }

  /**
   * Validate JWT payload and load user from database
   *
   * The payload comes from Entra ID and contains:
   * Standard Entra ID:
   * - oid: Object ID (Entra User ID)
   * - email/preferred_username: User email
   * - name: User's display name
   * - roles: Roles from Entra (if configured)
   * 
   * External ID (B2C):
   * - oid/sub: Object ID (Entra User ID)
   * - emails: ARRAY of email addresses (first one is primary)
   * - name/given_name/family_name: User's display name
   * - extension_* : Custom attributes
   */
  async validate(payload: EntraJwtPayload) {
    const isExternalId = this.configService.get<string>("ENTRA_TYPE") === "external";
    
    // Extract user information from token (different structure for External ID)
    const entraUserId = payload.oid || payload.sub;
    
    let email: string | undefined;
    if (isExternalId) {
      // External ID can use 'emails' array, 'email', or 'preferred_username'
      email = Array.isArray(payload.emails) && payload.emails.length > 0 
        ? payload.emails[0] 
        : payload.email || payload.preferred_username || payload.upn;
    } else {
      // Standard Entra uses email/preferred_username/upn
      email = payload.email || payload.preferred_username || payload.upn;
    }

    this.logger.debug(
      `Validating ${isExternalId ? 'External ID' : 'Entra'} JWT for user: ${email}`,
    );

    if (!entraUserId || !email) {
      this.logger.warn("Entra JWT missing required claims (oid or email)");
      throw new UnauthorizedException("Invalid token: missing user information");
    }

    // Find user in MongoDB by email/username
    // Users authenticate via Entra (both Primary and Secondary users)
    this.logger.log(`🔎 Looking up user: username=${email}`);
    
    const user = await this.userModel.findOne({ 
      username: email
      // Removed userType filter to allow both Primary and Secondary users
    }).exec();

    if (!user) {
      this.logger.warn(`❌ User with email ${email} not found in database`);
      throw new UnauthorizedException("User not found in system");
    }

    this.logger.log(`✅ Found user: ${user._id} (${user.email}), userType: ${user.userType}`);

    // Check user is active
    if (user.status !== "active") {
      this.logger.warn(`Inactive user login attempt: ${email} (status: ${user.status})`);
      throw new UnauthorizedException("User account is not active");
    }

    this.logger.log(`✅ ${isExternalId ? 'External ID' : 'Entra'} JWT validated for user: ${email}`);

    // Return user data to be attached to request (req.user)
    return {
      userId: user._id.toString(),
      email: user.email,
      entraUserId: user.entraUserId,
      memberId: user.memberId,
      userType: "external",
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      // Roles from MongoDB (not Entra - you manage roles in your system)
      roles: [], // Add roles from your system if needed
      // Original Entra claims (for reference)
      entraClaims: {
        oid: payload.oid,
        sub: payload.sub,
        name: payload.name,
        email: isExternalId ? (payload.emails?.[0] || payload.email) : payload.email,
        roles: payload.roles || [],
      },
    };
  }
}

/**
 * Entra ID JWT Payload
 * Standard claims from Microsoft Entra ID tokens
 * 
 * Standard Entra ID vs External ID (B2C) differences:
 * - Standard: uses 'email', 'preferred_username'
 * - External ID: uses 'emails' (array), custom 'extension_*' attributes
 */
export interface EntraJwtPayload {
  oid?: string; // Object ID (Entra User ID) - standard Entra
  sub?: string; // Subject (usually same as oid) - External ID often uses this
  email?: string; // Email address (standard Entra)
  emails?: string[]; // Email addresses array (External ID/B2C)
  preferred_username?: string; // Usually email (standard Entra)
  upn?: string; // User Principal Name (standard Entra)
  name?: string; // Display name
  given_name?: string; // First name
  family_name?: string; // Last name
  roles?: string[]; // Roles from Entra (if app roles configured)
  iss: string; // Issuer (login.microsoftonline.com or b2clogin.com)
  aud: string; // Audience (your client ID)
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  nbf?: number; // Not before timestamp
  tid?: string; // Tenant ID
  [key: string]: any; // Additional claims (including extension_* for B2C)
}
