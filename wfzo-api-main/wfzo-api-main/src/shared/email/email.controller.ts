import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { EmailService } from "./email.service";
import {
  SendEmailDto,
  SendBulkEmailDto,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
} from "./dto/email.dto";
import { EmailTemplateCode, SupportedLanguage } from "./schemas/email-template.schema";

@ApiTags("Email")
@Controller("email")
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post("send")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a templated email" })
  @ApiResponse({ status: 200, description: "Email sent successfully" })
  @ApiResponse({ status: 404, description: "Template not found" })
  @ApiResponse({ status: 400, description: "Missing required parameters" })
  async sendEmail(@Body() dto: SendEmailDto) {
    await this.emailService.sendTemplatedEmail(dto);
    return { message: "Email sent successfully" };
  }

  @Post("send-bulk")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send bulk templated emails" })
  @ApiResponse({ status: 200, description: "Bulk emails sent successfully" })
  async sendBulkEmail(@Body() dto: SendBulkEmailDto) {
    await this.emailService.sendBulkTemplatedEmail(dto);
    return { message: "Bulk emails sent successfully" };
  }

  @Post("templates")
  @ApiOperation({ summary: "Create a new email template" })
  @ApiResponse({ status: 201, description: "Template created successfully" })
  async createTemplate(@Body() dto: CreateEmailTemplateDto) {
    return this.emailService.createTemplate(dto);
  }

  @Get("templates")
  @ApiOperation({ summary: "Get all active email templates" })
  @ApiResponse({ status: 200, description: "List of email templates" })
  async getAllTemplates() {
    return this.emailService.getAllTemplates();
  }

  @Get("templates/:templateCode")
  @ApiOperation({ summary: "Get an email template by code" })
  @ApiResponse({ status: 200, description: "Email template details" })
  @ApiResponse({ status: 404, description: "Template not found" })
  async getTemplate(@Param("templateCode") templateCode: EmailTemplateCode) {
    return this.emailService.getTemplate(templateCode);
  }

  @Put("templates/:templateCode")
  @ApiOperation({ summary: "Update an email template" })
  @ApiResponse({ status: 200, description: "Template updated successfully" })
  @ApiResponse({ status: 404, description: "Template not found" })
  async updateTemplate(
    @Param("templateCode") templateCode: EmailTemplateCode,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.emailService.updateTemplate(templateCode, dto);
  }

  @Delete("templates/:templateCode")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an email template (soft delete)" })
  @ApiResponse({ status: 204, description: "Template deleted successfully" })
  @ApiResponse({ status: 404, description: "Template not found" })
  async deleteTemplate(@Param("templateCode") templateCode: EmailTemplateCode) {
    await this.emailService.deleteTemplate(templateCode);
  }

  @Post("templates/:templateCode/preview")
  @ApiOperation({ summary: "Preview a template with sample parameters" })
  @ApiResponse({ status: 200, description: "Template preview" })
  async previewTemplate(
    @Param("templateCode") templateCode: EmailTemplateCode,
    @Body() body: { params: Record<string, any>; language?: SupportedLanguage },
  ) {
    return this.emailService.previewTemplate(templateCode, body.params, body.language);
  }
}
