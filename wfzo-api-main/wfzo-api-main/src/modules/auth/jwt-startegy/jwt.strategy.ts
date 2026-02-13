import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigService } from "@shared/config/config.service";
import { User, UserDocument } from "@modules/user/schemas/user.schema";
import { InternalUser, InternalUserDocument } from "@modules/admin/schemas/internal-user.schema";

export interface JwtPayload {
  sub: string;
  email?: string;
  roles?: string[];
  userType?: "internal" | "external"; // Distinguish between admin and Entra users
  [key: string]: unknown;
}

/**
 * Unified JWT strategy that handles both:
 * 1. Internal admin users (stored in MongoDB, authenticated via password)
 * 2. External users (stored in Entra ID, authenticated via OAuth)
 *
 * The userType in JWT payload determines which database to validate against.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(InternalUser.name) private internalUserModel: Model<InternalUserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getJwtSecret(),
      issuer: config.getJwtIssuer(),
      audience: config.getJwtAudience(),
    });
  }

  async validate(payload: JwtPayload) {
    const userType = payload.userType || "external"; // Default to external for backward compatibility

    if (userType === "internal") {
      // Internal admin user - validate against InternalUser collection
      const user = await this.internalUserModel
        .findOne({
          id: payload.sub,
          status: "active",
          deletedAt: null,
        })
        .exec();

      if (!user) {
        throw new UnauthorizedException("Internal user not found or inactive");
      }

      return {
        userId: user.id,
        email: user.email,
        roles: user.roles || [],
        userType: "internal" as const,
        displayName: user.displayName,
      };
    } else {
      // External user - validate against User collection (Entra ID users)
      const user = await this.userModel.findById(payload.sub).exec();

      if (!user) {
        throw new UnauthorizedException("External user not found");
      }

      if (user.status !== "active") {
        throw new UnauthorizedException("User account is not active");
      }

      // For external users, roles come from MongoDB (not Entra)
      return {
        userId: user._id.toString(),
        email: user.email,
        roles: payload.roles ?? [],
        userType: "external" as const,
        entraUserId: user.entraUserId,
        memberId: user.memberId,
      };
    }
  }
}
