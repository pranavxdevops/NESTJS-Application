import { Body, Controller, Get, HttpCode, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { EnquiriesService } from "./enquiries.service";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Enquiry } from "./schemas/enquiry.schema";
import { EnquiryType } from "./schemas/enquiry.schema";
import { UpdateEnquiryDto } from "./dto/update-enquiry.dto";
import { ApiKeyGuard } from "../auth/guards/api-key.guard";

@ApiTags("Enquiries")
@Controller("enquiries")
export class EnquiriesController {
  constructor(private readonly service: EnquiriesService) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  @HttpCode(201)
  @ApiOperation({
    summary: "Submit an enquiry",
    description:
      "Submit an enquiry of different types: become featured member, submit question, learn more, or consultancy needs. For 'submit_question', include 'subject'.",
  })
  @ApiBody({
    type: CreateEnquiryDto,
    examples: {
      become_featured_member: {
        summary: "Become a featured member enquiry",
        value: {
          userDetails: {
            firstName: "John",
            lastName: "Doe",
            organizationName: "Example Corp",
            country: "USA",
            phoneNumber: "+1-555-0123",
            email: "john@example.com",
          },
          enquiryType: EnquiryType.BECOME_FEATURED_MEMBER,
          message:
            "I would like to become a featured member. Please provide details on the process.",
          memberId: "MEMBER-008",
        },
      },
      submit_question: {
        summary: "Submit a question enquiry",
        value: {
          userDetails: {
            firstName: "Jane",
            lastName: "Smith",
            organizationName: "Query Inc",
            country: "UK",
            phoneNumber: "+44-20-1234-5678",
            email: "jane@query.com",
          },
          enquiryType: EnquiryType.SUBMIT_QUESTION,
          subject: "Membership Benefits",
          message: "What are the benefits of premium membership?",
          memberId: "MEMBER-008",
        },
      },
      learn_more: {
        summary: "Learn more enquiry",
        value: {
          userDetails: {
            firstName: "Alex",
            lastName: "Johnson",
            organizationName: "Curious Ltd",
            country: "Canada",
            phoneNumber: "+1-416-555-0199",
            email: "alex@curious.ca",
          },
          enquiryType: EnquiryType.LEARN_MORE,
          message: "I want to learn more about WorldFZO events and networking opportunities.",
          memberId: "MEMBER-005",
        },
      },
      consultancy_needs: {
        summary: "Consultancy needs enquiry",
        value: {
          userDetails: {
            firstName: "Maria",
            lastName: "Garcia",
            organizationName: "Consult Co",
            country: "Spain",
            phoneNumber: "+34-91-234-5678",
            email: "maria@consult.es",
          },
          enquiryType: EnquiryType.CONSULTANCY_NEEDS,
          message: "We need consultancy services for free zone setup. Please contact us.",
          memberId: "MEMBER-003",
        },
      },
      request_additional_team_members: {
        summary: "Request additional team members enquiry",
        value: {
          userDetails: {
            firstName: "Team",
            lastName: "Lead",
            organizationName: "Growth Inc",
            country: "USA",
            phoneNumber: "+1-555-0987",
            email: "team@growth.com",
          },
          enquiryType: EnquiryType.REQUEST_ADDITIONAL_TEAM_MEMBERS,
          noOfMembers: 3,
          message: "We need 3 additional team members for our project.",
          memberId: "MEMBER-010",
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: "Enquiry submitted successfully",
    type: Enquiry,
  })
  async create(@Body() dto: CreateEnquiryDto) {
    return this.service.createEnquiry(dto);
  }

  @Put(":id")
  @UseGuards(ApiKeyGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: "Update enquiry status",
    description: "Update the status of an enquiry to approved or rejected, with optional comments.",
  })
  @ApiParam({
    name: "id",
    description: "Enquiry ID",
    type: String,
  })
  @ApiBody({
    type: UpdateEnquiryDto,
  })
  @ApiOkResponse({
    description: "Enquiry updated successfully",
    type: Enquiry,
  })
  async update(@Param("id") id: string, @Body() dto: UpdateEnquiryDto) {
    return this.service.updateEnquiry(id, dto);
  }

  @Get()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Get enquiries by type",
    description:
      "Retrieve enquiries filtered by enquiryType. If no type specified, returns all enquiries.",
  })
  @ApiQuery({
    name: "enquiryType",
    enum: EnquiryType,
    required: false,
    description: "Filter enquiries by type (optional)",
  })
  @ApiOkResponse({
    description: "List of enquiries",
    type: [Enquiry],
  })
  async findByType(@Query("enquiryType") enquiryType?: string) {
    return this.service.findEnquiriesByType(enquiryType);
  }

  @Get(":id")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Get enquiry by ID",
  })
  @ApiParam({
    name: "id",
    description: "Enquiry ID",
    type: String,
  })
  @ApiOkResponse({
    description: "Enquiry details",
    type: Enquiry,
  })
  async findById(@Param("id") id: string) {
    return this.service.findEnquiryById(id);
  }

  @Get("member/:memberId")
  @UseGuards(ApiKeyGuard)
  @ApiOperation({
    summary: "Get enquiries by member ID",
    description: "Retrieve enquiries for a specific member, optionally filtered by enquiryType.",
  })
  @ApiParam({
    name: "memberId",
    description: "Member ID (e.g., MEMBER-008)",
    type: String,
  })
  @ApiQuery({
    name: "enquiryType",
    enum: EnquiryType,
    required: false,
    description: "Filter enquiries by type (optional)",
  })
  @ApiOkResponse({
    description: "List of enquiries for the member",
    type: [Enquiry],
  })
  async findByMemberId(
    @Param("memberId") memberId: string,
    @Query("enquiryType") enquiryType?: string,
  ) {
    return await this.service.findEnquiriesByMember(memberId, enquiryType);
  }
}
