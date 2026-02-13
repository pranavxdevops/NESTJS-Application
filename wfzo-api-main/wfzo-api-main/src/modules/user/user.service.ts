import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { FilterQuery, UpdateQuery } from "mongoose";
import { MembershipService } from "@modules/membership/membership.service";
import { EntraService } from "@modules/auth/entra.service";
import { EmailService } from "@shared/email/email.service";
import { EmailTemplateCode } from "@shared/email/schemas/email-template.schema";
import { UserRepository } from "./repository/user.repository";
import { User } from "./schemas/user.schema";
import type {
  CreateUserWithEntraDto,
  UpdateProfileRequest,
  User as UserDto,
  UserAccess,
  UserInfo,
  UserSearchData,
  UserSearchQuery,
} from "./dto/user.dto";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly membership: MembershipService,
    private readonly repo: UserRepository,
    private readonly entraService: EntraService,
    private readonly emailService: EmailService,
  ) {}

  async createUser(user: { username: string; email?: string } & Partial<UserDto>): Promise<User> {
    const email = user.email ?? user.username;
    return this.repo.create({
      ...user,
      email,
      status: user.status ?? "active",
      deletedAt: null,
    });
  }

  async createUserWithEntra(dto: CreateUserWithEntraDto): Promise<User> {
    // 1. Create the user in the database


    this.logger.log(`Created user: ${dto.username}`);

    let entraUserId: string | undefined;
    let temporaryPassword: string | undefined;

    // 2. Create Entra ID user
    try {
      const entraResult = await this.entraService.createUser({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });
      
      console.log("🔥 Created user:", entraResult);
      entraUserId = entraResult.entraUserId;
      temporaryPassword = entraResult.temporaryPassword;

      // 3. Update user record with Entra ID
      await this.repo.updateOne(
        { username: dto.username },
        { $set: { entraUserId } }
      );

      this.logger.log(`Generated Entra ID for user: ${dto.username} (ID: ${entraUserId})`);
    } catch (error) {
      this.logger.error(`Failed to create Entra ID for user ${dto.username}:`, error);
      // Continue without failing user creation
    }
        const user = await this.repo.create({
      username: dto.username,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      contactNumber: dto.contactNumber,
      designation: dto.designation,
      userType: dto.userType,
      status: "active",
      deletedAt: null,
    });
    // 4. Send email with credentials if Entra ID was created
    if (entraUserId && temporaryPassword) {
      try {
        await this.emailService.sendTemplatedEmail({
          templateCode: EmailTemplateCode.INTERNAL_USER_CREDENTIALS,
          to: dto.username, // Send to username (email)
          params: {
            userEmail: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            temporaryPassword,
            userRoles: dto.userType || "User",
            adminPortalUrl: "https://portal.worldfzo.org", // Default URL
          },
        });

        this.logger.log(`Sent credentials email to: ${dto.username}`);
      } catch (error) {
        this.logger.error(`Failed to send credentials email to ${dto.username}:`, error);
        // Don't fail the operation if email fails
      }
    }

    return user;
  }

  async searchUsers(q: UserSearchQuery): Promise<UserSearchData> {
    const page = q.page && q.page > 0 ? q.page : 1;
    const pageSize = q.pageSize && q.pageSize > 0 ? q.pageSize : 20;

    const filter: FilterQuery<User> = {};
    if (q.username) {
      filter.username = { $regex: q.username, $options: "i" };
    }
    if (q.userType) {
      filter.userType = q.userType;
    }

    const result = await this.repo.findAll(filter, { page, pageSize });
    return {
      items: result.items as unknown as UserDto[],
      page: result.page,
    };
  }

  async updateProfile(username: string, req: UpdateProfileRequest): Promise<User> {
    const filter: FilterQuery<User> = { username };
    const existing = await this.repo.findOne(filter);

    if (!existing) {
      return this.repo.create({
        username,
        email: req.email ?? username,
        firstName: req.firstName,
        lastName: req.lastName,
        newsLetterSubscription: req.newsLetterSubscription,
        isMember: false,
        status: "active",
        deletedAt: null,
      });
    }

    const set: Partial<User> = {};
    if (req.email !== undefined) set.email = req.email;
    if (req.firstName !== undefined) set.firstName = req.firstName;
    if (req.lastName !== undefined) set.lastName = req.lastName;
    if (req.newsLetterSubscription !== undefined)
      set.newsLetterSubscription = req.newsLetterSubscription;
    if (req.correspondanceUser !== undefined) set.correspondanceUser = req.correspondanceUser;
    if (req.designation !== undefined) set.designation = req.designation;
    if (req.contactNumber !== undefined) set.contactNumber = req.contactNumber;

    const update: UpdateQuery<User> = { $set: set };
    const updated = await this.repo.updateOne(filter, update);
    if (!updated) throw new NotFoundException();
    return updated;
  }

  async getUserAccess(username: string): Promise<UserAccess> {
    const filter: FilterQuery<User> = { username };
    const u = await this.repo.findOne(filter);

    if (!u) {
      throw new NotFoundException(`User '${username}' not found`);
    }

    const membershipId = u.memberId ?? randomUUID();
    // For demo, choose membership type by heuristic: domain or name
    const type = u.userType?.toLowerCase() ?? (u.isMember ? "basic" : "basic");

    let entitlements: any = {};
    try {
      const features = await this.membership.getFeatures(type);

      entitlements = features.entitlements;
    } catch (error) {
      // If membership type doesn't exist, return empty entitlements
      if (error instanceof NotFoundException) {
        entitlements = {};
      } else {
        throw error;
      }
    }

    const userInfo: UserInfo = { id: membershipId, username: u.username };
    const access: UserAccess = {
      user: userInfo,
      membershipId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      entitlements,
      generatedAt: new Date().toISOString(),
    };
    return access;
  }

  async deleteProfile(username: string): Promise<void> {
    const filter: FilterQuery<User> = { username };
    const deleted = await this.repo.deleteOne(filter, true);
    if (!deleted) throw new NotFoundException();
  }
}
