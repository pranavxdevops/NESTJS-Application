import { Controller, Post, Body, Request, UseGuards, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { ReportMemberDto } from './dto/report.dto';
import { Request as ExpressRequest } from 'express';
import { UnifiedAuthGuard } from '../auth/guards/unified-auth.guard';

@ApiTags('Report')
@ApiBearerAuth()
@Controller('report')
@UseGuards(UnifiedAuthGuard) // 🔒 Protect all routes with Unified Auth (Entra)
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(private readonly reportService: ReportService) {}

  /**
   * Report a member or user
   * POST /wfzo/api/v1/report
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Report a member or user',
    description: 'Submit a report about inappropriate behavior, spam, or violations. Admin will be notified via email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Report submitted successfully',
    schema: {
      example: {
        success: true,
        message: 'Report submitted successfully. WFZO admin has been notified.',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async reportMember(
    @Request() req: ExpressRequest & { user: any },
    @Body() reportDto: ReportMemberDto,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} reporting member ${reportDto.reportedMemberId}`);

    const result = await this.reportService.reportMember(email, reportDto);

    return result;
  }
}
