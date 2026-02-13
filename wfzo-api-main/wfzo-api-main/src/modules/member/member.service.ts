import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { MemberRepository } from "./repository/member.repository";
import { CreateMemberDto } from "./dto/create-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { QueryMemberDto } from "./dto/query-member.dto";
import { FilterQuery } from "mongoose";
import { Member, UserSnapshot } from "./schemas/member.schema";
import {
  FeaturedMemberDto,
  PartnersAndSponsorsDto,
  PartnerDetailsDto,
  SponsorDetailsDto,
  MemberMapCoordinatesDto,
  MemberMapDataDto,
  CountryMemberCountDto,
  MemberMapMemberResponseDto,
} from "./dto/featured-member.dto";
import * as countries from "country-data";
import { UserService } from "@modules/user/user.service";
import { MemberUserDto, AddUserSnapshotDto } from "./dto/member-user.dto";
import { User } from "@modules/user/schemas/user.schema";
import {
  UpdateStatusDto,
  UpdatePaymentLinkDto,
  UpdatePaymentStatusDto,
} from "./dto/approval-workflow.dto";
import { WorkflowOrchestrator } from "./workflow/services/workflow-orchestrator.service";
import { createDeepMergeUpdate, deepMergeObjects } from "@shared/common/object-merge.util";
import { GeocodingService } from "@shared/geocoding/geocoding.service";
import { PaymentService } from "@modules/payment/payment.service";
import { CreatePaymentDto, PaymentResponseDto } from "@modules/payment/dto/payment.dto";
import { ConfigService } from "@shared/config/config.service";
import { BlobStorageService } from "@shared/blob/blob.service";

import { SaveAdditionalInfoDto, SubmitAdditionalInfoDto } from './dto/additional-info.dto';

@Injectable()
export class MemberService {
  constructor(
    private readonly repo: MemberRepository,
    private readonly userService: UserService,
    private readonly workflowOrchestrator: WorkflowOrchestrator,
    private readonly geocodingService: GeocodingService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
    private readonly blobService: BlobStorageService,
  ) {}

  /**
   * Create new member (Phase 1: Initial Application)
   * Delegates to WorkflowOrchestrator for complete Phase 1 workflow
   */
  protected async geocodeAddress(dto: UpdateMemberDto): Promise<void> {
  if (!dto.organisationInfo?.address) return;

  const { city, country, zip } = dto.organisationInfo.address;
  if (!city && !country && !zip) return;

  try {
    const result = await this.geocodingService.getCoordinates({
      city,
      country,
      zipcode: zip,
    });

    if (result) {
      dto.organisationInfo.address.latitude = result.latitude;
      dto.organisationInfo.address.longitude = result.longitude;
    }
  } catch (error) {
    console.warn(`Geocoding failed during save: ${error instanceof Error ? error.message : error}`);
    // Silent fail – don't break save
  }
}
  async create(dto: CreateMemberDto) {
    const result = await this.workflowOrchestrator.executePhase1(dto);

    if (!result.success) {
      throw new Error(result.error || "Failed to create member");
    }

    return result.entity;
  }

  async findOneApplication(applicationId: string) {
    const filter: FilterQuery<Member> = { applicationNumber: applicationId };
    const found = await this.repo.findOne(filter);
    if (!found) throw new NotFoundException();
    return found;
  }

  async findOne(memberId: string) {
    const filter: FilterQuery<Member> = { memberId: memberId };
    const found = await this.repo.findOne(filter);
    if (!found) throw new NotFoundException();
    
    // Generate signed URLs for logo and license if they exist
    if (found.organisationInfo) {
      // Handle logo URL
      const logoUrl = found.organisationInfo.memberLogoUrl;
      if (logoUrl && logoUrl.trim()) {
        try {
          let blobPath = logoUrl;
          
          // Check if URL already has SAS parameters or is a full URL
          if (logoUrl.includes('?') && logoUrl.includes('sig=')) {
            blobPath = logoUrl.split('?')[0];
            blobPath = this.blobService.extractBlobPath(blobPath);
          } else if (logoUrl.startsWith('http')) {
            blobPath = this.blobService.extractBlobPath(logoUrl);
          }
          
          const signedUrlData = this.blobService.getSignedUrlWithMetadata(blobPath, 43200); // 12 hours
          found.organisationInfo.memberLogoUrl = signedUrlData.url;
          found.organisationInfo.memberLogoUrlExpiresAt = signedUrlData.expiresAt?.toISOString();
          found.organisationInfo.memberLogoUrlExpiresIn = signedUrlData.expiresIn;
        } catch (error) {
          console.error(`Failed to generate signed URL for logo ${logoUrl}:`, error);
        }
      }
      
      // Handle license URL
      const licenseUrl = found.organisationInfo.memberLicenceUrl;
      if (licenseUrl && licenseUrl.trim()) {
        try {
          let blobPath = licenseUrl;
          
          // Check if URL already has SAS parameters or is a full URL
          if (licenseUrl.includes('?') && licenseUrl.includes('sig=')) {
            blobPath = licenseUrl.split('?')[0];
            blobPath = this.blobService.extractBlobPath(blobPath);
          } else if (licenseUrl.startsWith('http')) {
            blobPath = this.blobService.extractBlobPath(licenseUrl);
          }
          
          const signedUrlData = this.blobService.getSignedUrlWithMetadata(blobPath, 43200); // 12 hours
          found.organisationInfo.memberLicenceUrl = signedUrlData.url;
          found.organisationInfo.memberLicenceUrlExpiresAt = signedUrlData.expiresAt?.toISOString();
          found.organisationInfo.memberLicenceUrlExpiresIn = signedUrlData.expiresIn;
        } catch (error) {
          console.error(`Failed to generate signed URL for license ${licenseUrl}:`, error);
        }
      }
    }
    
    return found;
  }

  async findByEmail(email: string) {
    const filter: FilterQuery<Member> = { "userSnapshots.email": email };
    const found = await this.repo.findOne(filter);
    if (!found) throw new NotFoundException(`Member with email ${email} not found`);
    return found;
  }

  async findByCompanyName(companyName: string) {
    const filter: FilterQuery<Member> = { "organisationInfo.companyName": companyName };
    const found = await this.repo.findOne(filter);
    if (!found) throw new NotFoundException(`Member with company name ${companyName} not found`);
    return found;
  }

  async search(query: QueryMemberDto) {
    const filter: FilterQuery<Member> = {};
    
    if (query.q) {
      const or = [{ "organisationInfo.companyName": { $regex: query.q, $options: "i" } }];
      (filter as unknown as Record<string, unknown>).$or = or;
    }
    
    if (query.status) {
      filter.status = query.status;
    }
    
    return this.repo.findAll(filter, {
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  /**
   * Update member (Phase 2: Application Completion)
   * Delegates to WorkflowOrchestrator for complete Phase 2 workflow
   */
  /**
   * Update member details
   * Routes to appropriate workflow phase based on dto.phase indicator
   */
  async update(memberId: string, dto: UpdateMemberDto) {
    const action = dto.action || "submit"; // "save" or "submit" or undefined → treat as submit
    // Route based on phase indicator from UI (cast to string for comparison)
    const phaseStr = String(dto.phase || "phase2"); // Default to phase2 for backward compatibility
    // ──────────────────────────────
  //  SAVE DRAFT – only raw DB update
  // ──────────────────────────────
  if (action === "save") {
    return this.saveAsDraft(memberId, dto);
  }
    // Phase 2: Complete application (no user additions)
    if (phaseStr === "phase2") {
      const result = await this.workflowOrchestrator.executePhase2(memberId, dto);
      if (!result.success) {
        throw new Error(result.error || "Failed to update member");
      }
      return result.entity;
    }

    // Phase 3: Post-approval updates (add users, questionnaires)
    if (phaseStr === "phase3") {
      const result = await this.workflowOrchestrator.executePhase3(memberId, dto);
      if (!result.success) {
        throw new Error(result.error || "Failed to update member");
      }
      return result.entity;
    }
    throw new Error(`Invalid phase: ${phaseStr}. Use 'phase2', 'phase3', or 'general'`);
  }
  // member.service.ts

private async saveAsDraft(memberId: string, dto: UpdateMemberDto): Promise<any> {
  const member = await this.repo.findOne({ memberId });
  if (!member) throw new NotFoundException("Member not found");

  // Geocode if address is provided
  await this.geocodeAddress(dto);

  // Remove only fields we must never touch in draft
  const { action, phase, ...dataToSave } = dto;

  // Deep merge update
  const updateFields = createDeepMergeUpdate(dataToSave as any);

  // Save memberUsers array fully
  if (dto.memberUsers !== undefined) {
    updateFields.memberUsers = dto.memberUsers;
  }

  // Save without changing status
  await this.repo.updateOne({ memberId }, { $set: updateFields });

  const updatedMember = await this.repo.findOne({ memberId });

  return {
    success: true,
    message: "Draft saved successfully – team members preserved",
    member: updatedMember,
  };
}
  // Below are placeholder implementations; these would be backed by actual data sources
  logActivity(body: {
    memberId: string;
    featureKey: string;
    timestamp?: string;
    usageCount?: number;
  }) {
    // echo back with a fake increment if usageCount present
    const usageCount = typeof body.usageCount === "number" ? body.usageCount + 1 : 1;
    return {
      memberId: body.memberId,
      featureKey: body.featureKey,
      timestamp: body.timestamp,
      usageCount,
    };
  }

  /**
   * Get distinct list of industries across all members
   * @returns Array of industry names
   */
  async getIndustries(): Promise<string[]> {
    const members = await this.repo.findAll({}, { page: 1, pageSize: 10000 });

    // Extract all industries from all members
    const industriesSet = new Set<string>();
    members.items.forEach((member: Member) => {
      if (member.organisationInfo?.industries) {
        member.organisationInfo.industries.forEach((industry: string) => {
          if (industry) {
            industriesSet.add(industry);
          }
        });
      }
    });

    // Return sorted array of unique industries
    return Array.from(industriesSet).sort();
  }

  /**
   * Get partners and sponsors
   * Partners and sponsors are identified by specific membership categories
   * @returns Object with partners and sponsors arrays
   */
  async getPartnersAndSponsors(): Promise<PartnersAndSponsorsDto> {
    // Get strategic members (these are partners/sponsors)
    const strategicMembers = await this.repo.findAll(
      {
        category: "strategicMembers",
        status: "active",
      },
      { page: 1, pageSize: 100 },
    );

    // For now, treating all strategic members as partners
    // In the future, you might add a field to distinguish between partners and sponsors
    const partners: PartnerDetailsDto[] = strategicMembers.items.map((member: Member) => ({
      id: member.memberId || "",
      name: member.organisationInfo?.companyName || "",
      logoUrl: member.organisationInfo?.memberLogoUrl,
      websiteUrl: member.organisationInfo?.websiteUrl,
      industries: member.organisationInfo?.industries || [],
    }));

    // You can add logic here to separate sponsors from partners
    // For example, based on a field like `partnerType` or tier
    const sponsors: SponsorDetailsDto[] = [];

    return {
      partners,
      sponsors,
    };
  }

  /**
   * Get featured members
   * Returns members marked as featured with trimmed information
   * @returns Array of featured member details
   */
  async getFeatured(): Promise<FeaturedMemberDto[]> {
    const featuredMembers = await this.repo.findAll(
      {
        featuredMember: true,
        status: "active",
      },
      { page: 1, pageSize: 100 },
    );

    return featuredMembers.items.map((member: Member) => ({
      id: member.memberId || "",
      memberCode: member.memberId || "", // Using memberId as memberCode
      name: member.organisationInfo?.companyName || "",
      logoUrl: member.organisationInfo?.memberLogoUrl,
      description: "", // Add description field to schema if needed
      industries: member.organisationInfo?.industries || [],
    }));
  }

  /**
   * Standardize country names (same logic as migration script)
   */
  private standardizeCountryName(country: string): string {
    const normalized = country.trim().toLowerCase();

    const countryMap: Record<string, string> = {
      // North America variations
      "united states of america": "United States",
      "united states": "United States",
      "usa": "United States",
      "us": "United States",
      
      // Asia variations
      "south korea": "South Korea",
      "korea": "South Korea",
      "united arab emirates": "United Arab Emirates",
      "uae": "United Arab Emirates",
      
      // Africa variations
      "democratic republic of the congo (kinshasa)": "Democratic Republic of the Congo",
      "democratic republic of the congo": "Democratic Republic of the Congo",
      "dr congo": "Democratic Republic of the Congo",
      "congo (kinshasa)": "Democratic Republic of the Congo",
      "drc": "Democratic Republic of the Congo",
      
      // Europe variations
      "uk": "United Kingdom",
      "united kingdom": "United Kingdom",
    };

    return countryMap[normalized] || country.trim();
  }

  /**
   * Helper method to get continent name for a country
   * Uses country-data library for lookups
   * @param countryName - Country name or code
   * @returns Continent name or "Other"
   */
  private getContinentForCountry(countryName: string): string {
    // First standardize the country name
    const standardized = this.standardizeCountryName(countryName);
    const normalized = standardized.toLowerCase().trim();

    try {
      // Find country by name or code
      const countryData = (
        countries.countries.all as readonly { name: string; alpha2: string; alpha3: string }[]
      ).find(
        (c) =>
          c.name.toLowerCase() === normalized ||
          c.alpha2 === standardized.toUpperCase() ||
          c.alpha3 === standardized.toUpperCase(),
      );

      if (!countryData) {
        // Manual fallback for countries not in the library
        const manualMapping: Record<string, string> = {
          "unknown": "Other",
          "palestine": "Asia",
          "taiwan": "Asia",
          "kosovo": "Europe",
          "russia": "Europe",  // Russia spans both but commonly classified as Europe
          "south korea": "Asia",
          "iran": "Asia",
          "vietnam": "Asia",
        };
        return manualMapping[normalized] || "Other";
      }

      // Check which continent contains this country
      // Note: The library has a typo in the runtime property name 'antartica' (missing 'c')
      // but TypeScript types define it as 'antarctica'. We use type assertion to access it.
      const continentList = [
        { name: "Africa", continent: countries.continents.africa },
        { name: "Asia", continent: countries.continents.asia },
        { name: "Europe", continent: countries.continents.europe },
        { name: "North America", continent: countries.continents.northAmerica },
        { name: "Oceania", continent: countries.continents.oceania },
        { name: "South America", continent: countries.continents.southAmerica },
      ];

      for (const { name, continent } of continentList) {
        const countryList = continent.countries as unknown as readonly string[];
        if (countryList.includes(countryData.alpha2)) {
          return name;
        }
      }

      return "Other";
    } catch (error) {
      console.error(`Error looking up continent for "${countryName}":`, error);
      return "Other";
    }
  }

  private buildAggregates(members: Member[]): MemberMapDataDto {
    const continentMemberCount: Record<string, number> = {};
    const countryDataMap: Map<string, { count: number; latitude?: number; longitude?: number }> =
      new Map();

    for (const member of members) {
      const rawCountry = member.organisationInfo?.address?.country;
      // Normalize country name: trim whitespace, default to 'Unknown' if missing
      const country = rawCountry ? rawCountry.trim() : 'Unknown';

      const existingData = countryDataMap.get(country) || {
        count: 0,
        latitude: undefined,
        longitude: undefined,
      };

      existingData.count += 1;

      if (
        existingData.latitude === undefined &&
        member.organisationInfo?.address?.latitude !== undefined &&
        member.organisationInfo?.address?.longitude !== undefined
      ) {
        existingData.latitude = member.organisationInfo.address.latitude;
        existingData.longitude = member.organisationInfo.address.longitude;
      }

      countryDataMap.set(country, existingData);

      const continentName = this.getContinentForCountry(country);
      continentMemberCount[continentName] = (continentMemberCount[continentName] || 0) + 1;
    }

    const countryMemberCount: CountryMemberCountDto[] = Array.from(countryDataMap.entries())
      .map(([country, data]) => ({
        country,
        count: data.count,
        latitude: data.latitude,
        longitude: data.longitude,
      }))
      .sort((a, b) => b.count - a.count);

    return { continentMemberCount, countryMemberCount };
  }

  private hasValidCoords(member: Member): boolean {
    const lat = member.organisationInfo?.address?.latitude;
    const lon = member.organisationInfo?.address?.longitude;
    return lat !== undefined && lon !== undefined && lat !== null && lon !== null && lat !== 0 && lon !== 0;
  }

  /**
   * Get member map data
   * Returns either aggregate counts or member coordinates based on action
   * @param action - "view-map" for aggregate data, "view-member" for coordinates
   * @returns Map data based on action type
   */
  async getMapData(
    action: string,
  ): Promise<MemberMapDataDto | MemberMapMemberResponseDto> {
    if (action === "view-member") {
      // Return member coordinates with aggregate summary
      const members = await this.repo.findMany({ status: "active" });

      const membersWithValidCoords = members.filter((m) => this.hasValidCoords(m));

      const companyMapData: MemberMapCoordinatesDto[] = membersWithValidCoords
        .map((member: Member) => ({
          id: member.memberId || "",
          companyName: member.organisationInfo?.companyName || "",
          latitude: member.organisationInfo!.address!.latitude!,
          longitude: member.organisationInfo!.address!.longitude!,
          country: member.organisationInfo?.address?.country,
          countryCode: member.organisationInfo?.address?.countryCode,
          city: member.organisationInfo?.address?.city,
          memberLogoUrl: member.organisationInfo?.memberLogoUrl || "",
          industries: member.organisationInfo?.industries || [],
          category: member.category || "N/A",
          typeOfTheOrganization: member.organisationInfo?.typeOfTheOrganization || "N/A",
          websiteUrl: member.organisationInfo?.websiteUrl || "N/A",
        }));

      const aggregates = this.buildAggregates(membersWithValidCoords);

      return {
        ...aggregates,
        companyMapData,
        totalMembers: members.length,
        membersWithCoordinates: companyMapData.length,
      };
    }

    // Default: view-map - return aggregate counts
    const members = await this.repo.findMany({ status: "active" });
    const membersWithValidCoords = members.filter((m) => this.hasValidCoords(m));

    return this.buildAggregates(membersWithValidCoords);
  }

  getStatus(memberId: string) {
    return { memberId: memberId, status: "active" };
  }

  /**
   * Create or update users and return their snapshots
   * This handles bidirectional relationship: User ↔ Member
   */
  private async createOrUpdateUsers(
    memberUsers: MemberUserDto[],
    memberId: string,
  ): Promise<{ userSnapshots: UserSnapshot[] }> {
    const userSnapshots: UserSnapshot[] = [];

    for (const userDto of memberUsers) {
      let user: User;

      if (userDto.id) {
        // Update existing user
        user = await this.userService.updateProfile(userDto.username, {
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
      } else {
        // Create new user
        user = await this.userService.createUser({
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
          memberId: memberId, // Set bidirectional relationship
        });
      }

      // MongoDB returns document with _id field
      const userId = (user as unknown as { _id: { toString: () => string } })._id?.toString() ?? "";

      // Create snapshot for denormalization
      userSnapshots.push({
        id: userId,
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
      });
    }

    return { userSnapshots };
  }

  /**
   * Sync user snapshots when users are updated externally
   * This should be called from UserService when user profile is updated
   */
  async syncUserSnapshot(userId: string, user: User): Promise<void> {
    // Find all members that have this user in their snapshots
    const members = await this.repo.findAll(
      { "userSnapshots.id": userId },
      { page: 1, pageSize: 100 },
    );

    for (const member of members.items) {
      if (!member.userSnapshots) continue;

      // Update the snapshot
      const snapshotIndex = member.userSnapshots.findIndex((s) => s.id === userId);
      if (snapshotIndex >= 0) {
        member.userSnapshots[snapshotIndex] = {
          id: userId,
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

        // Update member document
        await this.repo.updateOne(
          { memberId: member.memberId },
          { $set: { userSnapshots: member.userSnapshots } },
        );
      }
    }
  }

  /**
   * WORKFLOW METHODS - Delegated to WorkflowOrchestrator
   */

  /**
   * Update member status with approval/rejection workflow
   * Delegates to WorkflowOrchestrator
   */
  async updateMemberStatus(memberId: string, dto: UpdateStatusDto): Promise<Member> {
    let result;

    if (dto.action === "approve") {
      result = await this.workflowOrchestrator.executeApproval(memberId, dto);
      if (result.success && result?.entity?.status === "approvedPendingPayment") {
        await this.createPaymentLink("", result.entity);
      }
    } else {
      result = await this.workflowOrchestrator.executeRejection(memberId, dto);
    }

    if (!result.success) {
      throw new Error(result.error || "Failed to update member status");
    }

    return result.entity;
  }

  /**
  * Create payment link and send email
  * @param memberId - Member ID
  * @param entityData - Entity data
  * @returns Payment response 
  */
  async createPaymentLink(memberId: string, entityData?: Member): Promise<PaymentResponseDto> {
    const entity = entityData || await this.repo.findOne({ memberId });
    // Check if member exists
    if (!entity) {
      throw new NotFoundException(`Member ${memberId} not found.`);
    }
    const paymentDto: CreatePaymentDto = {
      entityId: entity.memberId,
      entityType: "member",
      entity: entity as Record<string, any>,
      amount: this.configService.getMembershipFeeAmount(),
      currency: this.configService.getPaymentGatewayCurrency(),
    };
    // Check if member's payment status is already paid
    if (entity?.paymentStatus === "paid") {
      throw new BadRequestException(
        `Member ${entity?.memberId} payment status is already paid. No need to generate a new payment link.`,
      );
    }
    const response = await this.paymentService.createPaymentLink(paymentDto);
    const paymentLink: string = response?.paymentLink || "";
    const result = await this.workflowOrchestrator.addPaymentLink(paymentDto.entityId,
      { paymentLink: paymentLink, paymentStatus: "pending" }
    );
    if (!result.success) {
      throw new Error(result.error || "Failed to update payment link");
    }
    return response;
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(memberId: string): Promise<PaymentResponseDto> {
    return await this.paymentService.getPaymentStatusByEntityIdAndPaymentType(memberId, "membership");
  }

  /**
   * Get payment details for a member (without syncing with gateway)
   */
  async getPaymentDetails(memberId: string): Promise<PaymentResponseDto> {
    return await this.paymentService.getPaymentDetailsByEntityIdAndPaymentType(memberId, "membership");
  }

  /**
   * Update payment link and send email
   * Delegates to WorkflowOrchestrator
   */
  async updatePaymentLink(memberId: string, dto: UpdatePaymentLinkDto): Promise<Member> {
    const result = await this.workflowOrchestrator.addPaymentLink(memberId, dto);

    if (!result.success) {
      throw new Error(result.error || "Failed to update payment link");
    }

    return result.entity;
  }

  /**
   * Update payment status and activate membership
   * Delegates to WorkflowOrchestrator
   */
  async updatePaymentStatus(memberId: string, dto: UpdatePaymentStatusDto): Promise<Member> {
    const result = await this.workflowOrchestrator.completePayment(memberId, dto);

    if (!result.success) {
      throw new Error(result.error || "Failed to update payment status");
    }

    return result.entity;
  }

  /**
   * Add or update a user snapshot in a member's userSnapshots array
   * Action-based logic: 'addUser' creates new snapshot + Entra provisioning
   * 'editUser' updates existing snapshot only (no Entra provisioning)
   */
  async addUserSnapshot(memberId: string, dto: AddUserSnapshotDto) {
    // 1. Check if member exists
    const member = await this.repo.findOne({ memberId });
    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    // 2. Handle based on action
    if (dto.action === "addUser") {
      // ADD USER: Create new snapshot + provision Entra ID
      // 3. Check if email already exists in userSnapshots
      if (member.userSnapshots?.some(snapshot => snapshot.email === dto.email)) {
        throw new BadRequestException(`User with email ${dto.email} already exists in member snapshots`);
      }

      // 4. Create the snapshot object
      const newSnapshot = {
        id: randomUUID(), // Generate new ObjectId-like string
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        userType: dto.userType,
        contactNumber: dto.contactNumber,
        designation: dto.designation,
        newsLetterSubscription: dto.newsLetterSubscription,
        profileImageUrl: dto.profileImageUrl,
        lastSyncedAt: new Date(),
      };

      // 5. Append snapshot to userSnapshots array using $push
      await this.repo.updateOne(
        { memberId },
        { $push: { userSnapshots: newSnapshot } }
      );

      // 6. Provision Entra ID and send email (reuse User creation logic)
      try {
        await this.userService.createUserWithEntra({
          username: dto.email,
          email: dto.email,
          firstName: dto.firstName || "",
          lastName: dto.lastName || "",
          contactNumber: dto.contactNumber,
          designation: dto.designation,
          userType: dto.userType,
        });
      } catch (error) {
        // If Entra provisioning fails, we should not have updated the DB
        // But since we already pushed to array, we need to handle this
        // For now, we'll log the error but keep the snapshot
        // In a production system, you might want to remove the snapshot on failure
        console.error(`Failed to provision Entra ID for ${dto.email}:`, error);
        throw new BadRequestException(`Failed to provision Entra ID: ${error instanceof Error ? error.message : error}`);
      }

      // Fetch updated member to return
      const updatedMember = await this.repo.findOne({ memberId });

      return {
        success: true,
        message: "User snapshot added and Entra ID provisioned successfully",
        member: updatedMember,
      };

    } else {
      // EDIT USER: Update existing snapshot only (no Entra provisioning)
      // 3. Find the snapshot to update (prefer userSnapshotId, fallback to email)
      let snapshotQuery: any;
      if (dto.userSnapshotId) {
        snapshotQuery = { "userSnapshots.id": dto.userSnapshotId };
      } else if (dto.email) {
        snapshotQuery = { "userSnapshots.email": dto.email };
      } else {
        throw new BadRequestException("Either userSnapshotId or email is required for editUser action");
      }

      const existingMember = await this.repo.findOne({ memberId, ...snapshotQuery });
      if (!existingMember) {
        throw new NotFoundException(`User snapshot not found for the provided identifier`);
      }

      // 4. Prepare update fields (only editable fields)
      const updateFields: any = {
        "userSnapshots.$.lastSyncedAt": new Date(),
      };

      if (dto.firstName !== undefined) updateFields["userSnapshots.$.firstName"] = dto.firstName;
      if (dto.lastName !== undefined) updateFields["userSnapshots.$.lastName"] = dto.lastName;
      if (dto.contactNumber !== undefined) updateFields["userSnapshots.$.contactNumber"] = dto.contactNumber;
      if (dto.designation !== undefined) updateFields["userSnapshots.$.designation"] = dto.designation;
      if (dto.profileImageUrl !== undefined) updateFields["userSnapshots.$.profileImageUrl"] = dto.profileImageUrl;
      if (dto.newsLetterSubscription !== undefined) updateFields["userSnapshots.$.newsLetterSubscription"] = dto.newsLetterSubscription;

      // 5. Update the snapshot using positional operator
      await this.repo.updateOne(
        { memberId, ...snapshotQuery },
        { $set: updateFields }
      );

      // Fetch updated member to return
      const updatedMember = await this.repo.findOne({ memberId });

      return {
        success: true,
        message: "User snapshot updated successfully",
        member: updatedMember,
      };
    }
  }

  /**
    * Remove a user snapshot from a member's userSnapshots array
    */
  async removeUserSnapshot(memberId: string, userSnapshotId: string) {
    // 1. Check if member exists
    const member = await this.repo.findOne({ memberId });
    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    // 2. Check if the snapshot exists
    const snapshotExists = member.userSnapshots?.some(snapshot => snapshot.id === userSnapshotId);
    if (!snapshotExists) {
      throw new NotFoundException(`User snapshot ${userSnapshotId} not found in member ${memberId}`);
    }

    // 3. Remove the snapshot using $pull
    await this.repo.updateOne(
      { memberId },
      { $pull: { userSnapshots: { id: userSnapshotId } } }
    );

    // 4. Fetch and return updated member
    const updatedMember = await this.repo.findOne({ memberId });

    return {
      success: true,
      message: "User snapshot removed successfully",
      member: updatedMember,
    };
  }

  /**
   * Generic update method that can update any field in member
   * Special handling for allowedUserCount: adds to current value instead of replacing
   * Special handling for organisationInfo: merges with existing instead of replacing
   */
  async genericUpdate(memberId: string, dto: Record<string, any>) {
    // 1. Check if member exists
    const member = await this.repo.findOne({ memberId });
    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    // 2. Prepare update object
    const updateFields: Record<string, any> = {};

    // 3. Handle special case for allowedUserCount
    if (dto.allowedUserCount !== undefined) {
      const currentCount = member.allowedUserCount || 0;
      const additionalCount = dto.allowedUserCount;
      updateFields.allowedUserCount = currentCount + additionalCount;
    }

    // 4. Handle organisationInfo merging
    if (dto.organisationInfo !== undefined) {
      const existingOrgInfo = member.organisationInfo || {};
      const incomingOrgInfo = dto.organisationInfo;

      // Handle socialMediaHandle specially (array merging by title)
      let mergedOrgInfo: any;
      if (incomingOrgInfo.socialMediaHandle !== undefined) {
        // Create a copy of incoming without socialMediaHandle for deep merge
        const { socialMediaHandle: incomingSocialMedia, ...incomingWithoutSocial } = incomingOrgInfo;
        // Deep merge the rest
        mergedOrgInfo = deepMergeObjects(existingOrgInfo, incomingWithoutSocial);
        // Special merge for socialMediaHandle
        mergedOrgInfo.socialMediaHandle = this.mergeSocialMediaHandles(
          existingOrgInfo.socialMediaHandle || [],
          incomingSocialMedia || []
        );
      } else {
        // No socialMediaHandle in payload, deep merge everything
        mergedOrgInfo = deepMergeObjects(existingOrgInfo, incomingOrgInfo);
      }

      updateFields.organisationInfo = mergedOrgInfo;
    }

    // 5. Handle other fields normally (excluding organisationInfo as it's handled above)
    Object.keys(dto).forEach(key => {
      if (key !== 'allowedUserCount' && key !== 'organisationInfo') {
        updateFields[key] = dto[key];
      }
    });

    // 6. Update the member
    await this.repo.updateOne({ memberId }, { $set: updateFields });

    // 7. Fetch and return updated member
    const updatedMember = await this.repo.findOne({ memberId });

    return {
      success: true,
      message: "Member updated successfully",
      member: updatedMember,
    };
  }

  /**
   * Merge socialMediaHandle arrays, unique by title
   * If title exists, update url; if not, add new entry
   */
  private mergeSocialMediaHandles(existing: any[], incoming: any[]): any[] {
    const merged = [...existing];
    const existingTitles = new Set(existing.map(item => item.title));

    incoming.forEach(incomingItem => {
      const existingIndex = merged.findIndex(item => item.title === incomingItem.title);
      if (existingIndex >= 0) {
        // Update existing
        merged[existingIndex].url = incomingItem.url;
      } else {
        // Add new
        merged.push({ title: incomingItem.title, url: incomingItem.url });
      }
    });

    return merged;
  }

  async getActiveMembersOrgInfo(isFeatured: boolean = false): Promise<any[]> {
    const query: FilterQuery<Member> = {
      status: "active",
    };

    if (isFeatured) {
      query.featuredMember = true;
    }

    const members = await this.repo.findMany(query);

    return members.map((member) => {
      const logoUrl = member.organisationInfo?.memberLogoUrl;
      let signedUrlData = { url: logoUrl || "", expiresAt: new Date(), expiresIn: 0 };

      // Generate signed URL with metadata if logo exists and is not empty
      if (logoUrl && logoUrl.trim()) {
        try {
          // Check if URL already has SAS parameters (contains "?" and "sig=")
          if (logoUrl.includes('?') && logoUrl.includes('sig=')) {
            // Already a signed URL - refresh the signature
            // Extract the base URL (everything before the query string)
            const baseUrl = logoUrl.split('?')[0];
            
            // Extract just the blob path from the base URL
            const blobPath = this.blobService.extractBlobPath(baseUrl);
            
            // Generate new signed URL with the same blob path
            signedUrlData = this.blobService.getSignedUrlWithMetadata(blobPath, 43200); // 12 hours
          } else if (logoUrl.startsWith('http')) {
            // Full URL without SAS - generate signed URL
            const blobPath = this.blobService.extractBlobPath(logoUrl);
            signedUrlData = this.blobService.getSignedUrlWithMetadata(blobPath, 43200); // 12 hours
          } else {
            // Relative path - generate signed URL directly
            signedUrlData = this.blobService.getSignedUrlWithMetadata(logoUrl, 43200); // 12 hours
          }
        } catch (error) {
          console.error(`Failed to generate signed URL for ${logoUrl}:`, error);
          // Fallback to original URL
          signedUrlData.url = logoUrl;
        }
      }

      return {
        companyName: member.organisationInfo?.companyName,
        industries: member.organisationInfo?.industries,
        address: member.organisationInfo?.address,
        memberLogoUrl: signedUrlData.url || undefined, // Don't send empty strings
        memberLogoUrlExpiresAt: signedUrlData.url ? signedUrlData.expiresAt?.toISOString() : undefined,
        memberLogoUrlExpiresIn: signedUrlData.url ? signedUrlData.expiresIn : undefined,
        featuredMember: member.featuredMember,
      };
    });
  }

  async saveAdditionalInfoDraft(memberId: string, dto: SaveAdditionalInfoDto) {
    const member = await this.repo.findOne({ memberId });
    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    const currentAdditional = member.additionalInfo || { status: "draft" };
    // Use deep merge to properly handle nested objects in additional info
    const updatedAdditional = deepMergeObjects(currentAdditional, { ...dto, status: "draft" }) as any;

    await this.repo.updateOne({ memberId }, { $set: { additionalInfo: updatedAdditional } });

    const updated = await this.repo.findOne({ memberId });

    return {
      success: true,
      message: "Draft saved successfully",
      member: updated,
    };
  }

  async submitAdditionalInfo(memberId: string, dto: SubmitAdditionalInfoDto) {
    const member = await this.repo.findOne({ memberId });
    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found`);
    }

    const currentAdditional = member.additionalInfo || {};
    // Use deep merge to properly handle nested objects in additional info
    const updatedAdditional = deepMergeObjects(currentAdditional, { ...dto, status: "submitted" }) as any;

    await this.repo.updateOne({ memberId }, { $set: { additionalInfo: updatedAdditional } });

    const updated = await this.repo.findOne({ memberId });

    return {
      success: true,
      message: "Additional info submitted successfully",
      member: updated,
    };
  }
}
