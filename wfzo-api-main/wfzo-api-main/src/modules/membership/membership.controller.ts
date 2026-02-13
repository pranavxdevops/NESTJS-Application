import { Controller, Get, Post, Delete, Param, Body, HttpCode, HttpStatus } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiSecurity,
  ApiBody,
} from "@nestjs/swagger";
import { MembershipService } from "./membership.service";
import { MembershipFeatures } from "./dto/membership.dto";
import { CreateMembershipDto } from "./dto/create-membership.dto";

@ApiTags("Membership")
@Controller("membership")
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Get("features/:type")
  @ApiOperation({
    summary: "Get membership features/rules",
    description:
      "Return features and rules associated with a membership type. The Membership module defines different membership plans (Basic, Premium, Corporate, etc.) with associated features and quotas. It manages member features access based on their membership type.",
    operationId: "getMembershipFeatures",
  })
  @ApiParam({
    name: "type",
    description: "Membership type identifier (e.g., basic, core, premium)",
    example: "premium",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Successful operation - Returns membership features and entitlements",
    type: MembershipFeatures,
  })
  @ApiResponse({
    status: 404,
    description: "Membership type not found",
    schema: {
      example: {
        statusCode: 404,
        message: "Membership type 'premium' not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Unexpected error",
  })
  @ApiSecurity("api_key")
  async getFeatures(@Param("type") type: string): Promise<MembershipFeatures> {
    return this.membershipService.getFeatures(type);
  }

  @Post("features/:type")
  @ApiOperation({
    summary: "Create or Update membership features/rules",
    description:
      "Create or update features and rules associated with a membership type. This endpoint manages the entitlements map that defines access levels, quotas, payment requirements, and approval workflows for various features within a membership tier.",
    operationId: "updateMembershipFeatures",
  })
  @ApiParam({
    name: "type",
    description: "Membership type identifier (e.g., basic, core, premium)",
    example: "premium",
    required: true,
  })
  @ApiBody({
    type: CreateMembershipDto,
    description: "Membership features and entitlements configuration",
    examples: {
      premium: {
        summary: "Premium Membership Example",
        value: {
          type: "premium",
          description: "Premium membership with full access to all features",
          entitlements: {
            "events.seats": {
              access: "restricted",
              quota: {
                kind: "seats",
                limit: 100,
                used: 0,
                remaining: 100,
                window: "per-event",
              },
            },
            "library.downloads": {
              access: "restricted",
              quota: {
                kind: "downloads",
                limit: 500,
                used: 0,
                remaining: 500,
                window: "monthly",
              },
            },
            "community.access": {
              access: "unlimited",
            },
            "learning.courses.discount": {
              access: "payment",
              monetary: {
                paymentRequired: true,
                discountAvailable: true,
                discountType: "percentage",
                discountValue: 20,
                currency: "USD",
              },
              notes: "20% discount on paid courses",
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Successful operation - Membership features created or updated",
    type: MembershipFeatures,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input",
    schema: {
      example: {
        statusCode: 400,
        message: ["type should not be empty", "entitlements must be an object"],
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Unexpected error",
  })
  @ApiSecurity("api_key")
  async createOrUpdateFeatures(
    @Param("type") type: string,
    @Body() dto: CreateMembershipDto,
  ): Promise<MembershipFeatures> {
    return this.membershipService.createOrUpdateFeatures(type, dto);
  }

  @Delete("features/:type")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete membership features/rules",
    description:
      "Delete features and rules associated with a membership type. This performs a soft delete, marking the membership as deleted while preserving the data.",
    operationId: "deleteMembershipFeatures",
  })
  @ApiParam({
    name: "type",
    description: "Membership type identifier (e.g., basic, core, premium)",
    example: "premium",
    required: true,
  })
  @ApiResponse({
    status: 204,
    description: "Deleted - Membership features successfully deleted",
  })
  @ApiResponse({
    status: 404,
    description: "Membership type not found",
    schema: {
      example: {
        statusCode: 404,
        message: "Membership type 'premium' not found",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Unexpected error",
  })
  @ApiSecurity("api_key")
  async deleteFeatures(@Param("type") type: string): Promise<void> {
    return this.membershipService.deleteFeatures(type);
  }
}
