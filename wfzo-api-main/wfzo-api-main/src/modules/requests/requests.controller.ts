import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { RequestsService } from "./requests.service";
import { CreateRequestDto } from "./dto/create-request.dto";
import { UpdateRequestDto } from "./dto/update-request.dto";
import { SaveDraftRequestDto } from "./dto/save-draft-request.dto";
import { Request, RequestStatus } from "./schemas/request.schema";
import { ApiKeyGuard } from "@modules/auth/guards/api-key.guard";

/**
 * RequestsController handles all endpoints for organizationInfo update requests
 * Supports creation, approval/rejection, listing, and retrieval of requests
 */
@ApiTags("Requests")
@UseGuards(ApiKeyGuard)
@Controller("requests")
export class RequestsController {
  constructor(private readonly service: RequestsService) {}

  /**
   * POST /requests
   * Create a new organizationInfo update request
   * Available to all users/members
   */
  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: "Create organizationInfo update request",
    description:
      "Submit a request to update organizationInfo for a member. The request is created in PENDING status and requires admin approval. Frontend sends organizationInfo object and memberId. The endpoint validates that the memberId exists in the members collection.",
  })
  @ApiBody({
    type: CreateRequestDto,
    examples: {
      basic_update: {
        summary: "Basic organizationInfo update",
        description: "User submitting request to update company information",
        value: {
          organisationInfo: {
            companyName: "New Company Name Ltd",
            websiteUrl: "https://newwebsite.com",
            linkedInUrl: "https://linkedin.com/company/newcompany",
            industries: ["software", "consulting"],
          },
          memberId: "MEMBER-001",
        },
      },
      comprehensive_update: {
        summary: "Comprehensive organizationInfo update",
        description: "User updating multiple organizationInfo fields including address",
        value: {
          organisationInfo: {
            companyName: "Updated Corp",
            typeOfTheOrganization: "Limited Company",
            websiteUrl: "https://updatedcorp.com",
            linkedInUrl: "https://linkedin.com/company/updatedcorp",
            industries: ["manufacturing", "logistics"],
            position: "Managing Director",
            organisationContactNumber: "+1-555-0123",
            address: {
              line1: "123 Business Street",
              line2: "Suite 100",
              city: "New York",
              state: "NY",
              country: "USA",
              zip: "10001",
              latitude: 40.7128,
              longitude: -74.006,
            },
          },
          memberId: "MEMBER-001",
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: "Request created successfully in PENDING status",
    type: Request,
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        organisationInfo: {
          companyName: "New Company Name Ltd",
          websiteUrl: "https://newwebsite.com",
        },
        memberId: "MEMBER-001",
        requestStatus: "PENDING",
        comments: null,
        createdAt: "2024-01-14T10:00:00Z",
        updatedAt: "2024-01-14T10:00:00Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Bad request - invalid input or member not found",
    schema: {
      example: {
        statusCode: 400,
        message: 'Member with ID "MEMBER-999" not found. Please provide a valid memberId.',
        error: "Bad Request",
      },
    },
  })
  async create(@Body() dto: CreateRequestDto) {
    return this.service.createRequest(dto);
  }

  /**
   * POST /requests/draft
   * Save a draft organizationInfo update request
   * Available to all users/members for saving incomplete updates
   */
  @Post("draft")
  @HttpCode(201)
  @ApiOperation({
    summary: "Save draft organizationInfo update request",
    description:
      "Save a draft request to update organizationInfo for a member. The request is created in DRAFT status and no validation is performed. This allows users to save incomplete updates and submit them later. No admin approval required initially.",
  })
  @ApiBody({
    type: SaveDraftRequestDto,
    examples: {
      partial_draft: {
        summary: "Partial draft save",
        description: "User saving incomplete company information",
        value: {
          organisationInfo: {
            companyName: "Company Name",
          },
          memberId: "MEMBER-001",
        },
      },
      complete_draft: {
        summary: "Complete draft save",
        description: "User saving complete information as draft before submission",
        value: {
          organisationInfo: {
            companyName: "Updated Corp",
            websiteUrl: "https://updatedcorp.com",
            industries: ["manufacturing"],
            address: {
              city: "New York",
              country: "USA",
            },
          },
          memberId: "MEMBER-001",
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: "Draft created successfully in DRAFT status",
    type: Request,
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439012",
        organisationInfo: {
          companyName: "Company Name",
        },
        memberId: "MEMBER-001",
        requestStatus: "DRAFT",
        comments: null,
        createdAt: "2024-01-14T10:00:00Z",
        updatedAt: "2024-01-14T10:00:00Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Bad request - invalid input",
    schema: {
      example: {
        statusCode: 400,
        message: "memberId is required",
        error: "Bad Request",
      },
    },
  })
  async saveDraft(@Body() dto: SaveDraftRequestDto) {
    return this.service.saveDraft(dto);
  }

  /**
   * PUT /requests/:id
   * Update request status (admin only)
   * Approve or reject a pending request with mandatory comments
   */
  @Put(":id")
  @HttpCode(200)
  @ApiOperation({
    summary: "Approve or reject request (admin)",
    description:
      "Admin endpoint to approve or reject an organizationInfo update request. When changing status to APPROVED or REJECTED, comments are mandatory and will be visible to the member. When a request is APPROVED, the member's `organisationInfo` fields are applied to the member record (merged, not replaced).",
  })
  @ApiParam({
    name: "id",
    description: "Request ID (_id from request document)",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiBody({
    type: UpdateRequestDto,
    examples: {
      approve_request: {
        summary: "Approve request",
        value: {
          requestStatus: RequestStatus.APPROVED,
          comments: "Approved after verification of company details",
        },
      },
      reject_request: {
        summary: "Reject request",
        value: {
          requestStatus: RequestStatus.REJECTED,
          comments: "Logo file format not accepted. Please use PNG or JPG.",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Request status updated successfully",
    type: Request,
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        organisationInfo: {
          companyName: "New Company Name Ltd",
        },
        memberId: "MEMBER-001",
        requestStatus: "APPROVED",
        comments: "Approved after verification",
        createdAt: "2024-01-14T10:00:00Z",
        updatedAt: "2024-01-14T10:05:00Z",
      },
    },
  })
  @ApiBadRequestResponse({
    description: "Validation failed - missing comments or invalid status",
    schema: {
      example: {
        statusCode: 400,
        message: "Comments are required and cannot be empty when approving a request.",
        error: "Bad Request",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Request not found",
    schema: {
      example: {
        statusCode: 404,
        message: 'Request with ID "507f1f77bcf86cd799439999" not found.',
        error: "Not Found",
      },
    },
  })
  async update(@Param("id") id: string, @Body() dto: UpdateRequestDto) {
    return this.service.updateRequest(id, dto);
  }

  /**
   * GET /requests
   * List requests — supports filtering by status only (optional).
   * Pagination is applied server-side (default: page=1, pageSize=20).
   */
  @Get()
  @ApiOperation({
    summary: "List requests",
    description:
      "Retrieve requests with optional filtering by status only. Use ?status=PENDING to list pending requests. Pagination is applied server-side with defaults page=1 and pageSize=20.",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: RequestStatus,
    description: "Filter by request status (optional).",
    example: RequestStatus.PENDING,
  })
  @ApiOkResponse({
    description: "List of requests",
    schema: {
      example: {
        items: [
          {
            _id: "507f1f77bcf86cd799439011",
            organisationInfo: { companyName: "Company A" },
            memberId: "MEMBER-001",
            requestStatus: "PENDING",
            comments: null,
            createdAt: "2024-01-14T10:00:00Z",
          },
          {
            _id: "507f1f77bcf86cd799439012",
            organisationInfo: { companyName: "Company B" },
            memberId: "MEMBER-002",
            requestStatus: "APPROVED",
            comments: "Approved",
            createdAt: "2024-01-13T15:00:00Z",
          },
        ],
        page: {
          total: 2,
          page: 1,
          pageSize: 20,
        },
      },
    },
  })
  async findAll(@Query("status") status?: string) {
    return this.service.findAll(status);
  }

  /**
   * GET /requests/member/:memberId
   * Retrieve all requests sent to admin by a specific member
   */
  @Get("member/:memberId")
  @ApiOperation({
    summary: "Get requests by memberId",
    description: "Retrieve all requests submitted to admin by a specific member ID.",
  })
  @ApiParam({
    name: "memberId",
    description: "Member ID to filter requests",
    example: "MEMBER-001",
  })
  @ApiOkResponse({
    description: "Array of requests for the member",
    schema: {
      example: [
        {
          _id: "507f1f77bcf86cd799439011",
          organisationInfo: { companyName: "Company A" },
          memberId: "MEMBER-001",
          requestStatus: "PENDING",
          comments: null,
          createdAt: "2024-01-14T10:00:00Z",
        },
        {
          _id: "507f1f77bcf86cd799439012",
          organisationInfo: { companyName: "Company B" },
          memberId: "MEMBER-001",
          requestStatus: "APPROVED",
          comments: "Approved",
          createdAt: "2024-01-13T15:00:00Z",
        },
      ],
    },
  })
  async findByMemberId(@Param("memberId") memberId: string) {
    return this.service.findByMemberId(memberId);
  }

  /**
   * GET /requests/:id
   * Retrieve a specific request by ID
   */
  @Get(":id")
  @ApiOperation({
    summary: "Get request by ID",
    description: "Retrieve full details of a specific request by its ID",
  })
  @ApiParam({
    name: "id",
    description: "Request ID (_id from request document)",
    example: "507f1f77bcf86cd799439011",
  })
  @ApiOkResponse({
    description: "Request details",
    type: Request,
    schema: {
      example: {
        _id: "507f1f77bcf86cd799439011",
        organisationInfo: {
          companyName: "New Company Name Ltd",
          websiteUrl: "https://newwebsite.com",
          linkedInUrl: "https://linkedin.com/company/newcompany",
          industries: ["software"],
          address: {
            line1: "123 Street",
            city: "City",
            state: "State",
            country: "Country",
          },
        },
        memberId: "MEMBER-001",
        requestStatus: "PENDING",
        comments: null,
        createdAt: "2024-01-14T10:00:00Z",
        updatedAt: "2024-01-14T10:00:00Z",
      },
    },
  })
  @ApiNotFoundResponse({
    description: "Request not found",
    schema: {
      example: {
        statusCode: 404,
        message: 'Request with ID "507f1f77bcf86cd799439999" not found.',
        error: "Not Found",
      },
    },
  })
  async findById(@Param("id") id: string) {
    return this.service.findById(id);
  }
}
