import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { RefreshToken, RefreshTokenDocument } from "../schemas/refresh-token.schema";

/**
 * RefreshTokenRepository
 *
 * Data access layer for refresh tokens with security-focused operations.
 */
@Injectable()
export class RefreshTokenRepository {
  private readonly logger = new Logger(RefreshTokenRepository.name);

  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  /**
   * Create a new refresh token
   */
  async create(data: {
    token: string;
    userId: string;
    email: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<RefreshTokenDocument> {
    const refreshToken = new this.refreshTokenModel(data);
    return refreshToken.save();
  }

  /**
   * Find refresh token by token string
   */
  async findByToken(token: string): Promise<RefreshTokenDocument | null> {
    return this.refreshTokenModel.findOne({ token, revoked: false }).exec();
  }

  /**
   * Find all active tokens for a user
   */
  async findByUserId(userId: string): Promise<RefreshTokenDocument[]> {
    return this.refreshTokenModel
      .find({ userId, revoked: false, expiresAt: { $gt: new Date() } })
      .exec();
  }

  /**
   * Revoke a specific token
   */
  async revoke(token: string, replacedBy?: string): Promise<void> {
    await this.refreshTokenModel
      .updateOne(
        { token },
        {
          revoked: true,
          revokedAt: new Date(),
          ...(replacedBy && { replacedBy }),
        },
      )
      .exec();
  }

  /**
   * Revoke all tokens for a user (logout from all devices)
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany({ userId, revoked: false }, { revoked: true, revokedAt: new Date() })
      .exec();
    this.logger.log(`Revoked all refresh tokens for user: ${userId}`);
  }

  /**
   * Check if token is valid (not revoked and not expired)
   */
  async isValid(token: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenModel.findOne({ token }).exec();
    if (!refreshToken) return false;
    if (refreshToken.revoked) return false;
    if (refreshToken.expiresAt < new Date()) return false;
    return true;
  }

  /**
   * Clean up expired tokens (can be called by a cron job)
   */
  async deleteExpired(): Promise<number> {
    const result = await this.refreshTokenModel
      .deleteMany({ expiresAt: { $lt: new Date() } })
      .exec();
    this.logger.log(`Deleted ${result.deletedCount} expired refresh tokens`);
    return result.deletedCount || 0;
  }
}
