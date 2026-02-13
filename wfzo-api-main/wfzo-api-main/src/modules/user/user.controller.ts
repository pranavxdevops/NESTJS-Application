import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, Req } from "@nestjs/common";
import { UserService } from "./user.service";
import type { UserAccess, UserSearchData, UserType } from "./dto/user.dto";
import { CreateUserDto, CreateUserWithEntraDto, UpdateProfileDto } from "./dto/user.dto";
import type { UserSearchQueryDto } from "./dto/user-query.dto";
import { normalizePageQuery } from "@shared/common/pagination";
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

@ApiTags("User")
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /user
  @ApiOperation({
    summary: "Search users",
    description:
      "Search users by username (supports partial match), user type, and membership type. This search might be used by the internal admin users or in case the member wants to add sub users whose email is already registered in the system.",
  })
  @ApiQuery({ name: "username", required: false, example: "john" })
  @ApiQuery({
    name: "userType",
    required: false,
    enum: ["Primary", "Secondry", "Non Member", "Internal"],
  })
  @ApiQuery({ name: "membershipType", required: false, example: "premium" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "pageSize", required: false, example: 20 })
  @ApiOkResponse({
    description: "Paged list of users",
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              username: { type: "string", format: "email" },
              email: { type: "string", format: "email" },
              userType: {
                type: "string",
                enum: ["Primary", "Secondry", "Non Member", "Internal"],
              },
              firstName: { type: "string" },
              lastName: { type: "string" },
              newsLetterSubscription: { type: "boolean" },
              correspondanceUser: { type: "boolean" },
              designation: { type: "string" },
              contactNumber: { type: "string" },
              displayName: { type: "string" },
              avatarUrl: { type: "string", format: "uri" },
              status: { type: "string", enum: ["active", "inactive", "suspended"] },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
        page: {
          type: "object",
          properties: {
            total: { type: "integer", minimum: 0, example: 42 },
            page: { type: "integer", minimum: 1, example: 1 },
            pageSize: { type: "integer", minimum: 1, example: 20 },
          },
          required: ["total", "page", "pageSize"],
        },
      },
      required: ["items", "page"],
    },
    examples: {
      default: {
        summary: "Sample search result",
        value: {
          items: [
            {
              username: "john.doe@example.com",
              email: "john.doe@example.com",
              userType: "Primary",
              firstName: "John",
              lastName: "Doe",
              newsLetterSubscription: true,
              correspondanceUser: true,
              designation: "Manager",
              contactNumber: "+1 555-1212",
              displayName: "John Doe",
              avatarUrl: "https://cdn.example.com/avatar/john.png",
              status: "active",
              createdAt: "2024-01-01T10:00:00.000Z",
              updatedAt: "2024-06-01T10:00:00.000Z",
            },
            {
              username: "jane.smith@example.com",
              email: "jane.smith@example.com",
              userType: "Secondry",
              firstName: "Jane",
              lastName: "Smith",
              newsLetterSubscription: false,
              correspondanceUser: false,
              designation: "Analyst",
              contactNumber: "+44 20 7946 0958",
              displayName: "Jane Smith",
              avatarUrl: "https://cdn.example.com/avatar/jane.png",
              status: "inactive",
              createdAt: "2024-02-01T10:00:00.000Z",
              updatedAt: "2024-03-01T10:00:00.000Z",
            },
          ],
          page: { total: 2, page: 1, pageSize: 20 },
        },
      },
    },
  })
  @Get()
  async search(@Query() query: UserSearchQueryDto): Promise<UserSearchData> {
    const { page, pageSize } = normalizePageQuery({ page: query.page, pageSize: query.pageSize });
    return this.userService.searchUsers({
      username: query.username,
      userType: query.userType as UserType,
      membershipType: query.membershipType,
      page,
      pageSize,
    });
  }

  // POST /user
  @ApiOperation({
    summary: "Create a new user profile",
    description:
      "Create a new user profile; supports basic registration and full onboarding. Different use cases include: 1) News letter subscription only (grab the email and name(optional)); 2) Creating internal users; 3) Via onboarding service (member creation) for creating external users.",
  })
  @ApiBody({
    description: "User creation payload",
    examples: {
      newsletter: {
        summary: "Newsletter subscription only",
        value: {
          username: "subscriber@example.com",
          firstName: "Sam",
          lastName: "Subscriber",
          newsLetterSubscription: true,
        },
      },
      internalUser: {
        summary: "Create internal user",
        value: {
          username: "staff.user@wfzo.org",
          userType: "Internal",
          firstName: "Staff",
          lastName: "User",
          password: "S3cret!",
          correspondanceUser: false,
          designation: "Coordinator",
          contactNumber: "+971 4 123 4567",
        },
      },
      externalOnboarding: {
        summary: "External member onboarding",
        value: {
          username: "primary.user@member.com",
          email: "primary.user@member.com",
          userType: "Primary",
          firstName: "Primary",
          lastName: "User",
          correspondanceUser: true,
          designation: "Head of Operations",
          contactNumber: "+1 555-0199",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "User created",
    examples: {
      default: {
        summary: "Created user",
        value: {
          username: "primary.user@member.com",
          email: "primary.user@member.com",
          userType: "Primary",
          firstName: "Primary",
          lastName: "User",
          correspondanceUser: true,
          designation: "Head of Operations",
          contactNumber: "+1 555-0199",
          createdAt: "2024-01-01T10:00:00.000Z",
          updatedAt: "2024-01-01T10:00:00.000Z",
        },
      },
    },
  })
  // @Post()
  // @HttpCode(200)
  // async create(@Body() user: CreateUserDto) {
  //   return this.userService.createUser(user);
  // }

  // New POST /user endpoint with Entra ID creation and email
  @ApiOperation({
    summary: "Create a new user with Entra ID and send credentials",
    description:
      "Create a new user profile, generate Entra ID credentials, update the user record, and send credentials via email.",
  })
  @ApiBody({
    description: "User creation payload with Entra ID provisioning",
    schema: {
      type: "object",
      required: ["username", "email", "firstName", "lastName"],
      properties: {
        username: { type: "string", format: "email", example: "aswathyvishal2@gmail.com" },
        email: { type: "string", format: "email", example: "aswathyvishal2@gmail.com" },
        firstName: { type: "string", example: "Vishal" },
        lastName: { type: "string", example: "Nair" },
        contactNumber: { type: "string", example: "+971333333333333" },
        designation: { type: "string", example: "SE" },
        userType: { type: "string", enum: ["Primary", "Secondry", "Non Member", "Internal"], example: "Secondry" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "User created successfully with Entra ID and credentials sent",
    schema: {
      type: "object",
      properties: {
        username: { type: "string", format: "email" },
        email: { type: "string", format: "email" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        userType: { type: "string" },
        contactNumber: { type: "string" },
        designation: { type: "string" },
        entraUserId: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
  })
  @Post()
  @HttpCode(200)
  async createWithEntra(@Body() user: CreateUserWithEntraDto) {
  console.log("🔥 Incoming POST /user payload:", JSON.stringify(user, null, 2));
  return this.userService.createUserWithEntra(user);
}


  // PUT /user/profile/:username
  @ApiOperation({
    summary: "Update details in a user profile",
    description:
      "Update the profile fields for a user. Applies to users at any onboarding state. Individual users who are tied to a membership can update their own profile.",
  })
  @ApiParam({ name: "username", required: true })
  @ApiBody({
    description: "User profile fields to update",
    examples: {
      default: {
        summary: "Update profile",
        value: {
          email: "john.doe@example.com",
          displayName: "John D.",
          designation: "Senior Manager",
          correspondanceUser: true,
          contactNumber: "+1 555-1212",
          avatarUrl: "https://cdn.example.com/avatar/john.png",
          status: "active",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Updated user",
    examples: {
      default: {
        summary: "Updated profile",
        value: {
          username: "john.doe@example.com",
          email: "john.doe@example.com",
          displayName: "John D.",
          designation: "Senior Manager",
          correspondanceUser: true,
          contactNumber: "+1 555-1212",
          avatarUrl: "https://cdn.example.com/avatar/john.png",
          status: "active",
          updatedAt: "2024-06-01T10:00:00.000Z",
        },
      },
    },
  })
  @Put("profile/:username")
  async updateProfile(@Param("username") username: string, @Body() req: UpdateProfileDto) {
    return this.userService.updateProfile(username, req);
  }

  // GET /user/access/:username
  @ApiOperation({
    summary: "User Role based access",
    description:
      "Return entitlements (RBAC, quotas, paywalled features) for the user based on their membership. Supports multi-tier and multi-user memberships. Includes remaining quota details for each feature.",
  })
  @ApiParam({ name: "username", required: true })
  @ApiOkResponse({
    description: "Entitlements and RBAC details for user",
    schema: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            username: { type: "string", format: "email" },
          },
          required: ["id", "username"],
        },
        membershipId: { type: "string", format: "uuid" },
        entitlements: { type: "object", additionalProperties: true },
        generatedAt: { type: "string", format: "date-time" },
      },
      required: ["user", "membershipId", "entitlements", "generatedAt"],
    },
    examples: {
      default: {
        summary: "Access entitlements",
        value: {
          user: { id: "b1d5d8dd-3a2f-4d65-9d27-7b0f65e2d0aa", username: "john.doe@example.com" },
          membershipId: "c2f5b3a1-9e2d-4c7b-8f3a-0a1b2c3d4e5f",
          entitlements: {
            events: { register: { allowed: true, remainingQuota: 2 } },
            documents: { download: { allowed: true } },
          },
          generatedAt: "2024-06-01T10:00:00.000Z",
        },
      },
    },
  })
  @Get("access/:username")
  async getAccess(@Param("username") username: string): Promise<UserAccess> {
    return this.userService.getUserAccess(username);
  }

  // DELETE /user/profile/:username
  @ApiOperation({
    summary: "Delete a user profile",
    description:
      "Delete the user profile for the specified username. This action is irreversible. Primary user can remove sub users under their membership. Admin can remove the user profiles. Primary user can be deleted by Admin (to be confirmed).",
  })
  @ApiParam({ name: "username", required: true })
  @ApiResponse({ status: 204, description: "Deleted" })
  @Delete("profile/:username")
  @HttpCode(204)
  async remove(@Param("username") username: string) {
    await this.userService.deleteProfile(username);
  }
}
