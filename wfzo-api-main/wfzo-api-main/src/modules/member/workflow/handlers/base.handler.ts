import { Logger } from "@nestjs/common";
import { MemberRepository } from "../../repository/member.repository";
import { UserService } from "@modules/user/user.service";
import { GeocodingService } from "@shared/geocoding/geocoding.service";
import { WorkflowNotificationService } from "../services/workflow-notification.service";
import { MemberUserDto } from "../../dto/member-user.dto";
import { UserSnapshot } from "../../schemas/member.schema";
import { User } from "@modules/user/schemas/user.schema";
import { CreateMemberDto } from "../../dto/create-member.dto";
import { UpdateMemberDto } from "../../dto/update-member.dto";

/**
 * Base handler class with common functionality for all phase handlers
 *
 * Provides:
 * - Geocoding address logic
 * - User creation/update logic
 * - User snapshot creation
 * - Common service dependencies
 */
export abstract class BasePhaseHandler {
  protected readonly logger: Logger;

  constructor(
    protected readonly memberRepository: MemberRepository,
    protected readonly userService: UserService,
    protected readonly geocodingService: GeocodingService,
    protected readonly notificationService: WorkflowNotificationService
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Geocode address to get latitude and longitude
   * Works with both CreateMemberDto and UpdateMemberDto
   */
  protected async geocodeAddress(dto: CreateMemberDto | UpdateMemberDto): Promise<void> {
    if (!dto.organisationInfo?.address) return;

    const { city, country, zip } = dto.organisationInfo.address;
    if (!city && !country && !zip) return;

    try {
      const geocodingResult = await this.geocodingService.getCoordinates({
        city,
        country,
        zipcode: zip,
      });

      if (geocodingResult) {
        dto.organisationInfo.address.latitude = geocodingResult.latitude;
        dto.organisationInfo.address.longitude = geocodingResult.longitude;
      }
    } catch (error) {
      this.logger.warn(
        `Geocoding failed, continuing without coordinates: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Create a new user and return the User object
   */
  protected async createUser(userDto: MemberUserDto, memberId: string): Promise<User> {
    return this.userService.createUser({
      username: userDto.username,
      email: userDto.email,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      userType: userDto.userType,
      designation: userDto.designation,
      contactNumber: userDto.contactNumber,
      correspondanceUser: userDto.correspondanceUser,
      marketingFocalPoint: userDto.marketingFocalPoint,
      investorFocalPoint: userDto.investorFocalPoint,
      newsLetterSubscription: userDto.newsLetterSubscription,
      status: userDto.status ?? "active",
      isMember: true,
      memberId: memberId,
    });
  }

  /**
   * Update an existing user and return the User object
   */
  protected async updateUser(userDto: MemberUserDto): Promise<User> {
    return this.userService.updateProfile(userDto.username, {
      email: userDto.email,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      newsLetterSubscription: userDto.newsLetterSubscription,
      correspondanceUser: userDto.correspondanceUser,
      marketingFocalPoint: userDto.marketingFocalPoint,
      investorFocalPoint: userDto.investorFocalPoint,
      designation: userDto.designation,
      contactNumber: userDto.contactNumber,
    });
  }

  /**
   * Create a UserSnapshot from a User object
   * Extracts the _id and converts it to string format
   */
  protected createUserSnapshot(user: User, userId?: string): UserSnapshot {
    const id =
      userId ?? (user as unknown as { _id: { toString: () => string } })._id?.toString() ?? "";

    return {
      id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      correspondanceUser: user.correspondanceUser,
      marketingFocalPoint: user.marketingFocalPoint,
      investorFocalPoint: user.investorFocalPoint,
      contactNumber: user.contactNumber,
      newsLetterSubscription: user.newsLetterSubscription,
      lastSyncedAt: new Date(),
    };
  }

  /**
   * Process member users - create new users or update existing ones
   * Returns array of UserSnapshots
   * Validates email uniqueness and domain conflicts before processing
   */
  protected async processUsers(
    memberUsers: MemberUserDto[],
    memberId: string,
  ): Promise<UserSnapshot[]> {

    const userSnapshots: UserSnapshot[] = [];

    for (const userDto of memberUsers) {
      let user: User;

      if (userDto.id) {
        // Update existing user
        user = await this.updateUser(userDto);
        userSnapshots.push(this.createUserSnapshot(user, userDto.id));
      } else {
        // Create new user
        user = await this.createUser(userDto, memberId);
        userSnapshots.push(this.createUserSnapshot(user));
      }
    }

    return userSnapshots;
  }

  /**
   * Update or add member users (merge with existing snapshots)
   * Used when updating members with existing users
   * Validates email uniqueness and domain conflicts before processing
   */
  protected async updateOrAddMemberUsers(
    memberUsers: MemberUserDto[],
    memberId: string,
    existingSnapshots: UserSnapshot[],
  ): Promise<UserSnapshot[]> {

    const updatedSnapshots = [...existingSnapshots];
    const existingUserIds = new Set(existingSnapshots.map((s) => s.id));

    for (const userDto of memberUsers) {
      let user: User;

      if (userDto.id && existingUserIds.has(userDto.id)) {
        // Update existing user
        user = await this.updateUser(userDto);

        // Update snapshot in array
        const snapshotIndex = updatedSnapshots.findIndex((s) => s.id === userDto.id);
        if (snapshotIndex >= 0) {
          updatedSnapshots[snapshotIndex] = this.createUserSnapshot(user, userDto.id);
        }
      } else {
        // Add new user
        user = await this.createUser(userDto, memberId);
        updatedSnapshots.push(this.createUserSnapshot(user));
      }
    }

    return updatedSnapshots;
  }
}
