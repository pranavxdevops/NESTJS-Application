import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ApiKeyGuard } from "@modules/auth/guards/api-key.guard";
import { MemberService } from "./member.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { GetMemberByEmailDto } from "./dto/get-member-by-email.dto";
import { QueryMemberDto } from "./dto/query-member.dto";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { AddUserSnapshotDto } from "./dto/member-user.dto";
import { GenericUpdateMemberDto } from "./dto/generic-update-member.dto";
import { normalizePageQuery } from "@shared/common/pagination";
import {
  FeaturedMemberDto,
  PartnersAndSponsorsDto,
  MemberMapDataDto,
  MemberMapCoordinatesDto,
  MemberMapMemberResponseDto,
} from "./dto/featured-member.dto";
import {
  UpdateStatusDto,
  UpdatePaymentLinkDto,
  UpdatePaymentStatusDto,
} from "./dto/approval-workflow.dto";
import { PaymentResponseDto } from "@modules/payment/dto/payment.dto";
import { ActiveMembersResponseDto } from "./dto/active-members-response.dto";

import { SaveAdditionalInfoDto, SubmitAdditionalInfoDto } from "./dto/additional-info.dto";

@ApiTags("Member")
@Controller("member")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new member (Phase 1)",
    description:
      "Create a new member record for Phase 1 registration. Collects basic organization info, member users, and initial consent. Do NOT send status field - it's auto-set to 'pendingFormSubmission'.",
  })
  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: "Member created successfully. Returns the generated memberId.",
    schema: {
      example: {
        memberId: "MEMBER-001",
        applicationNumber: "APP-001",
        status: "pendingFormSubmission",
        message: "Phase 1 completed. Member can now proceed to Phase 2.",
      },
    },
  })
  async create(@Body() dto: CreateMemberDto) {
    return this.memberService.create(dto);
  }

  @Post("me")
  @ApiOperation({
    summary: "Get member details by email",
    description: "Retrieve member information using the user's email address",
  })
  @ApiOkResponse({ description: "Member details retrieved successfully" })
  async getByEmail(@Body() dto: GetMemberByEmailDto) {
    return this.memberService.findByEmail(dto.email);
  }

  @Put(":memberId")
  @ApiOperation({
    summary: "Update member details (Phase 2 and general updates)",
    description:
      "Update member information. For Phase 2 completion, include 'phase: phase2' and provide address, signature, and full consents. For general updates, omit the phase field.",
  })
  @ApiParam({ name: "memberId", required: true, description: "Member ID (e.g., MEMBER-001)" })
  @ApiOkResponse({
    description: "Member updated successfully",
    schema: {
      example: {
        success: true,
        message: "Phase 2 completed. Application submitted for Committee approval.",
        member: {
          memberId: "MEMBER-001",
          status: "pendingCommitteeApproval",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Example Phase 2 request body",
    schema: {
      example: {
        organisationInfo: {
          address: {
            line1: "123 Main St",
            line2: "Suite 400",
            city: "Metropolis",
            state: "NY",
            country: "USA",
            zip: "12345",
          },
          signatoryName: "John Doe",
          signatoryPosition: "CEO",
          signature: "data:image/png;base64,iVBORw0KGgoAAAANS...",
        },
        memberConsent: {
          articleOfAssociationConsent: true,
          memberShipFeeConsent: true,
        },
        phase: "phase2",
      },
    },
  })
  async update(@Param("memberId") memberId: string, @Body() dto: UpdateMemberDto) {
    return this.memberService.update(memberId, dto);
  }
  // member.controller.ts

@Put("save/:memberId")
@ApiOperation({ summary: "SAVE DRAFT – Update member without workflow" })
@ApiParam({ name: "memberId", required: true })
@ApiOkResponse({ description: "Draft saved successfully" })
async saveDraft(
  @Param("memberId") memberId: string,
  @Body() dto: UpdateMemberDto
) {
  // Force action = save (even if frontend forgets)
  dto.action = "save";
  return this.memberService.update(memberId, dto);
}

  @Put("status/:memberId")
  @ApiOperation({
    summary: "Update member status with approval/rejection workflow",
    description:
      "Update member status with approval or rejection. Handles approval workflow (Committee → Board → CEO) and rejection at any stage. Sends appropriate emails and tracks history.",
  })
  @ApiParam({ name: "memberId", required: true, description: "Member ID or Application Number" })
  @ApiOkResponse({ description: "successful operation" })
  async updateStatus(@Param("memberId") memberId: string, @Body() dto: UpdateStatusDto) {
    return this.memberService.updateMemberStatus(memberId, dto);
  }

  @Get("payment-status/:memberId")
  @ApiOperation({
    summary: "Check payment status",
    description:
      "Checks payment status and when payment is marked as 'paid', activates membership and sends welcome email.",
  })
  @ApiParam({ name: "memberId", required: true, description: "Member ID" })
  @ApiOkResponse({ description: "Payment status updated successfully" })
  async checkPaymentStatus(
    @Param("memberId") memberId: string
  ) {
    return this.memberService.checkPaymentStatus(memberId);
  }

  @Put("payment-link/:memberId")
  @ApiOperation({
    summary: "Update payment link for approved member",
    description:
      "Add or update payment link for a member in approvedPendingPayment status. Sends payment link email to member.",
  })
  @ApiParam({ name: "memberId", required: true, description: "Member ID" })
  @ApiOkResponse({ description: "Payment link updated successfully" })
  async updatePaymentLink(@Param("memberId") memberId: string, @Body() dto: UpdatePaymentLinkDto) {
    return this.memberService.updatePaymentLink(memberId, dto);
  }

  @Put("payment-status/:memberId")
  @ApiOperation({
    summary: "Update payment status",
    description:
      "Mark payment as complete or pending. When payment is marked as 'paid', activates membership and sends welcome email.",
  })
  @ApiParam({ name: "memberId", required: true, description: "Member ID" })
  @ApiOkResponse({ description: "Payment status updated successfully" })
  async updatePaymentStatus(
    @Param("memberId") memberId: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.memberService.updatePaymentStatus(memberId, dto);
  }

  @Patch(":memberId")
  @ApiOperation({
    summary: "Add or update user snapshot in member",
    description: "Add a new user snapshot with Entra ID provisioning or update an existing snapshot. Action is controlled by the 'action' field: 'addUser' creates new snapshot + Entra provisioning, 'editUser' updates existing snapshot only.",
  })
  @ApiParam({ name: "memberId", required: true, description: "Member ID (e.g., MEMBER-001)" })
  @ApiOkResponse({
    description: "Operation completed successfully",
    schema: {
      oneOf: [
        {
          title: "Add User (creates new snapshot + Entra provisioning)",
          example: {
            success: true,
            message: "User snapshot added and Entra ID provisioned successfully",
            member: {
              memberId: "MEMBER-001",
              userSnapshots: [
                {
                  id: "new-generated-id",
                  email: "new.user@example.com",
                  firstName: "New",
                  lastName: "User",
                  userType: "Secondry",
                  designation: "Software Engineer",
                  contactNumber: "+971555555555",
                  newsLetterSubscription: false,
                  profileImageUrl: "https://cdn.example.com/profile.png",
                  lastSyncedAt: "2026-01-08T06:30:00.000Z"
                }
              ]
            }
          }
        },
        {
          title: "Edit User (updates existing snapshot only)",
          example: {
            success: true,
            message: "User snapshot updated successfully",
            member: {
              memberId: "MEMBER-001",
              userSnapshots: [
                {
                  id: "existing-id",
                  email: "user@example.com",
                  firstName: "Updated Name",
                  designation: "Senior Engineer",
                  profileImageUrl: "https://cdn.example.com/new-profile.png",
                  lastSyncedAt: "2026-01-08T06:30:00.000Z"
                }
              ]
            }
          }
        }
      ]
    }
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - duplicate email, missing required fields, or invalid data"
  })
  @ApiResponse({
    status: 404,
    description: "Member not found or user snapshot not found (for editUser action)"
  })
  async addUserSnapshot(@Param("memberId") memberId: string, @Body() dto: AddUserSnapshotDto) {
    return this.memberService.addUserSnapshot(memberId, dto);
  }

  @Delete(":memberId/user/:userSnapshotId")
  @ApiOperation({
    summary: "Remove user snapshot from member",
    description: "Remove a specific user snapshot from the member's userSnapshots array",
  })
  @ApiParam({ name: "memberId", required: true, description: "Member ID (e.g., MEMBER-001)" })
  @ApiParam({ name: "userSnapshotId", required: true, description: "User snapshot ID to remove" })
  @ApiOkResponse({
    description: "User snapshot removed successfully",
    schema: {
      example: {
        success: true,
        message: "User snapshot removed successfully",
        member: {
          memberId: "MEMBER-001",
          userSnapshots: [
            // remaining snapshots after removal
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: "Member not found or user snapshot not found"
  })
  async removeUserSnapshot(@Param("memberId") memberId: string, @Param("userSnapshotId") userSnapshotId: string) {
    return this.memberService.removeUserSnapshot(memberId, userSnapshotId);
  }

  @Patch("update/:memberId")
  @ApiOperation({
    summary: "Generic update member fields",
    description:
      "Update any field in member record. For allowedUserCount, the provided value is added to the current count instead of replacing it. organisationInfo is optional and supports partial updates - only provided fields are updated while existing fields are never removed. socialMediaHandle array is merged by title (unique identifier). This is a non-destructive PATCH operation.",
  })
  @ApiParam({ name: "memberId", required: true, description: "Member ID (e.g., MEMBER-001)" })
  @ApiOkResponse({
    description: "Member updated successfully",
    schema: {
      oneOf: [
        {
          title: "General field update",
          example: {
            success: true,
            message: "Member updated successfully",
            member: {
              memberId: "MEMBER-001",
              featuredMember: true,
              allowedUserCount: 10,
            },
          }
        },
        {
          title: "organisationInfo merge example",
          example: {
            success: true,
            message: "Member updated successfully",
            member: {
              memberId: "MEMBER-001",
              organisationInfo: {
                companyName: "Updated Company Name",
                websiteUrl: "https://www.updated.com",
                industries: ["existing-industry", "new-industry"],
                socialMediaHandle: [
                  { title: "facebook", url: "https://facebook.com/updated" },
                  { title: "twitter", url: "https://twitter.com/new" }
                ]
              }
            }
          }
        }
      ]
    },
  })
  @ApiResponse({
    status: 200,
    description: "Example request payloads for organisationInfo partial updates",
    schema: {
      oneOf: [
        {
          title: "Update single field (preserves existing fields)",
          example: {
            organisationInfo: {
              companyName: "Updated Company Name"
            }
          }
        },
        {
          title: "Add new field",
          example: {
            organisationInfo: {
              organisationContactNumber: "+911234567890"
            }
          }
        },
        {
          title: "Update nested object field (preserves other address fields)",
          example: {
            organisationInfo: {
              address: {
                city: "Dubai"
              }
            }
          }
        },
        {
          title: "organisationInfo not sent (no change to organisationInfo)",
          example: {
            featuredMember: true
          }
        }
      ]
    }
  })
  @ApiResponse({
    status: 404,
    description: "Member not found"
  })
  async genericUpdate(@Param("memberId") memberId: string, @Body() dto: GenericUpdateMemberDto) {
    return this.memberService.genericUpdate(memberId, dto);
  }

  @Get("industries")
  @ApiOperation({
    summary: "List industries",
    description: "Return the list of industries used for member classification and filtering.",
  })
  @ApiOkResponse({ description: "successful operation", type: [String] })
  async industries(): Promise<string[]> {
    return this.memberService.getIndustries();
  }

  @Get("partnersandSponsors")
  @ApiOperation({
    summary: "List partners and sponsors",
    description:
      "Return the current list of partnering organizations and sponsors with logos and links.",
  })
  @ApiOkResponse({ description: "successful operation", type: PartnersAndSponsorsDto })
  async partnersAndSponsors(): Promise<PartnersAndSponsorsDto> {
    return this.memberService.getPartnersAndSponsors();
  }

  @Get("featured")
  @ApiOperation({
    summary: "List featured members",
    description: "Return a curated list of featured members to highlight on the site.",
  })
  @ApiOkResponse({ description: "successful operation", type: [FeaturedMemberDto] })
  async featured(): Promise<FeaturedMemberDto[]> {
    return this.memberService.getFeatured();
  }

  @Get("mapdata/:action")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Get member map data",
    description:
      "Return data for the member map. When action=view-map, return aggregate counts by continent and country. When action=view-member, return member coordinates for map markers.",
  })
  @ApiParam({ name: "action", required: true })
  @ApiOkResponse({ description: "successful operation" })
  async mapData(
    @Param("action") action: string,
  ): Promise<MemberMapDataDto | MemberMapMemberResponseDto> {
    return this.memberService.getMapData(action);
  }

  @Get("application/:applicationId")
  @ApiOperation({
    summary: "Get member by Application ID",
    description: "Return member details using applicationId instead of memberId.",
  })
  @ApiParam({
    name: "applicationId",
    required: true,
    description: "Application ID (e.g., APP-001)",
  })
  @ApiOkResponse({ description: "Member fetched successfully using applicationId" })
  async getByApplicationId(@Param("applicationId") applicationId: string) {
    return this.memberService.findOneApplication(applicationId);
  }

  @Get("by-company/:companyName")
  @ApiOperation({
    summary: "Get member by Company Name",
    description: "Return whole member data using company name.",
  })
  @ApiParam({
    name: "companyName",
    required: true,
    description: "Company Name",
  })
  @ApiOkResponse({ description: "Member fetched successfully using company name" })
  async getByCompanyName(@Param("companyName") companyName: string) {
    return this.memberService.findByCompanyName(companyName);
  }

  @Get("active-list")
  @ApiOperation({
    summary: "List all active members organization info",
    description: "Get all members with status='active' and return only organization information: companyName, industries, address, and memberLogoUrl",
  })
  @ApiQuery({
    name: "featuredMember",
    required: false,
    type: Boolean,
    description: "Filter only featured members if set to true",
  })
  @ApiOkResponse({
    type: [ActiveMembersResponseDto],
    description: "List of active members with organization info",
  })
  async getActiveMembersOrgInfo(
    @Query("featuredMember") featuredMember?: string
  ): Promise<ActiveMembersResponseDto[]> {
    const isFeatured = featuredMember === "true";
    return this.memberService.getActiveMembersOrgInfo(isFeatured);
  }

  @Get(":memberId")
  @ApiOperation({
    summary: "Get member by ID",
    description:
      "Return the member profile and related membership information for the given member ID.",
  })
  @ApiParam({ name: "memberId", required: true })
  @ApiOkResponse({ description: "successful operation" })
  async getById(@Param("memberId") memberId: string) {
    return this.memberService.findOne(memberId);
  }

  @Get()
  @ApiOperation({
    summary: "Search members",
    description:
      "Search members by various filters (e.g., featured, country, industry, starting letter, free text). Supports pagination.",
  })
  @ApiQuery({ name: "q", required: false, description: "Free text query", example: "Acme" })
  @ApiQuery({ name: "status", required: false, description: "Specific status like pendingCommitteeApproval", example: "pendingCommitteeApproval" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "pageSize", required: false, example: 20 })
  @ApiOkResponse({ description: "successful operation" })
  async search(@Query() query: QueryMemberDto) {
    const { page, pageSize } = normalizePageQuery({ page: query.page, pageSize: query.pageSize });
    return this.memberService.search({ ...query, page, pageSize });
  }

  @Patch("activity")
  @ApiOperation({
    summary: "Log Member activity",
    description:
      "Record a member's feature usage (e.g., a click). The backend increments usage and responds with the latest count for that feature.",
  })
  @ApiOkResponse({
    description: "Activity logged successfully; returns the latest usage count after update",
  })
  logActivity(
    @Body()
    body: {
      memberId: string;
      featureKey: string;
      timestamp?: string;
      usageCount?: number;
    },
  ) {
    return this.memberService.logActivity(body);
  }

  @Get("payment/link/:memberId")
  @ApiParam({ name: "memberId", required: true, description: "Member ID" })
  @HttpCode(200)
  @ApiOperation({
    summary: "Create a payment link",
    description:
      "Creates a payment link for a member. Only requires memberId and amount. Member details are automatically fetched and used to construct the payment gateway request. Returns a payment link that can be used to complete the payment.",
  })
  @ApiOkResponse({
    description: "Payment link created successfully",
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid payment request data or member missing required information",
  })
  @ApiResponse({
    status: 404,
    description: "Member not found",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error or payment gateway error",
  })
  async createPaymentLink(@Param("memberId") memberId: string): Promise<PaymentResponseDto> {
    return this.memberService.createPaymentLink(memberId);
  }

  @Get("payment-details/:memberId")
  @ApiOperation({
    summary: "Get payment details",
    description:
      "Get payment details for a member.",
  })
  @ApiParam({ name: "memberId", required: true, description: "Member ID" })
  @ApiOkResponse({ description: "Payment details retrieved successfully" })
  async getPaymentDetails(
    @Param("memberId") memberId: string
  ) {
    return this.memberService.getPaymentDetails(memberId);
  }

  @Patch(":memberId/additional-info/draft")
  @ApiOperation({ summary: "Save draft additional info without validation" })
  @ApiParam({ name: "memberId", description: "Member ID" })
  @ApiBody({ type: SaveAdditionalInfoDto })
  async saveAdditionalInfoDraft(
    @Param("memberId") memberId: string,
    @Body() dto: SaveAdditionalInfoDto,
  ) {
    return this.memberService.saveAdditionalInfoDraft(memberId, dto);
  }

  @Patch(":memberId/additional-info/submit")
  @ApiOperation({ summary: "Submit additional info with validation" })
  @ApiParam({ name: "memberId", description: "Member ID" })
  @ApiBody({ type: SubmitAdditionalInfoDto })
  async submitAdditionalInfo(
    @Param("memberId") memberId: string,
    @Body() dto: SubmitAdditionalInfoDto,
  ) {
    return this.memberService.submitAdditionalInfo(memberId, dto);
  }
}
