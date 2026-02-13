import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";
import { OrganizationService } from "./organization.service";
import {
  SendOrganizationEmailRequest,
  SendOrganizationEmailResponse,
} from "./dto/organization.dto";

@ApiTags("Organization")
@Controller("organization")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post("send-email")
  @HttpCode(200)
  @ApiOperation({
    summary: "Send organization notification email",
    description:
      "Send a templated email for organization notifications (approval, rejection, submission)",
  })
  @ApiBody({ type: SendOrganizationEmailRequest })
  @ApiResponse({
    status: 200,
    description: "Email sent successfully",
    type: SendOrganizationEmailResponse,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  async sendOrganizationEmail(
    @Body() dto: SendOrganizationEmailRequest,
  ): Promise<SendOrganizationEmailResponse> {
    return this.organizationService.sendOrganizationEmail(dto);
  }
}
