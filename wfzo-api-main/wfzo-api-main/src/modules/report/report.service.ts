import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../shared/email/email.service';
import { ReportMemberDto } from './dto/report.dto';
import { Member } from '../member/schemas/member.schema';
import { EmailTemplateCode, SupportedLanguage } from '../../shared/email/schemas/email-template.schema';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly adminEmail: string;

  constructor(
    private readonly emailService: EmailService,
    @InjectModel(Member.name) private readonly memberModel: Model<Member>,
    private readonly configService: ConfigService,
  ) {
    // Get admin email from config or use default
    this.adminEmail = this.configService.get<string>('WFZO_ADMIN_EMAIL') || 'admin@wfzo.com';
  }

  /**
   * Report a member - sends email to admin using database template
   */
  async reportMember(
    reporterEmail: string,
    reportDto: ReportMemberDto,
  ): Promise<{ success: boolean; message: string }> {
    // Get reporter member details
    const reporterMember = await this.memberModel.findOne({
      'userSnapshots.email': { $regex: new RegExp(`^${reporterEmail}$`, 'i') },
    }).lean();
    
    if (!reporterMember) {
      throw new NotFoundException('Reporter member not found');
    }

    // Get reported member details
    const reportedMember = await this.memberModel.findOne({ 
      memberId: reportDto.reportedMemberId 
    }).lean();
    
    if (!reportedMember) {
      throw new NotFoundException('Reported member not found');
    }

    // Find reporter user details
    const reporterUser = reporterMember.userSnapshots?.find(
      (u: any) => u.email?.toLowerCase() === reporterEmail.toLowerCase(),
    );

    // Find reported user details (if user-level report)
    let reportedUser = null;
    if (reportDto.reportedUserId) {
      reportedUser = reportedMember.userSnapshots?.find(
        (u: any) => u.id === reportDto.reportedUserId,
      );
    }

    // Prepare template parameters for admin email
    const reporterName = reporterUser 
      ? `${reporterUser.firstName} ${reporterUser.lastName}`
      : reporterEmail;

    const reportedUserName = reportedUser
      ? `${reportedUser.firstName} ${reportedUser.lastName} (${reportedUser.email})`
      : '';

    const adminParams = {
      reporterMemberId: reporterMember.memberId,
      reporterCompany: reporterMember.organisationInfo?.companyName || 'N/A',
      reporterName,
      reporterEmail,
      reportedMemberId: reportedMember.memberId,
      reportedCompany: reportedMember.organisationInfo?.companyName || 'N/A',
      reportedUserName,
      reportType: reportedUser ? 'User' : 'Organization',
      reason: reportDto.reason,
      timestamp: new Date().toLocaleString(),
    };

    // Send email to admin using database template
    try {
      // 1. Send report to admin
      await this.emailService.sendTemplatedEmail({
        to: this.adminEmail,
        templateCode: EmailTemplateCode.MEMBER_REPORT_ADMIN,
        params: adminParams,
        language: SupportedLanguage.ENGLISH,
        replyTo: reporterEmail,
      });

      this.logger.log(
        `Report email sent to admin - Reporter: ${reporterMember.memberId}, Reported: ${reportDto.reportedMemberId}`,
      );

      // 2. Send confirmation email to reporter
      await this.sendConfirmationEmail(reporterEmail, reporterUser, reportedMember, reportedUser, reportDto);

      return {
        success: true,
        message: 'Report submitted successfully. WFZO admin has been notified.',
      };
    } catch (error) {
      this.logger.error(`Failed to send report email: ${error}`);
      throw new Error('Failed to submit report. Please try again later.');
    }
  }

  /**
   * Send confirmation email to reporter using database template
   */
  private async sendConfirmationEmail(
    reporterEmail: string,
    reporterUser: any,
    reportedMember: any,
    reportedUser: any,
    reportDto: ReportMemberDto,
  ): Promise<void> {
    const reporterName = reporterUser 
      ? `${reporterUser.firstName} ${reporterUser.lastName}`
      : reporterEmail;

    // Determine what was reported - user or organization
    let reportedName: string;
    let reportType: string;

    if (reportedUser) {
      // User-level report
      reportedName = `${reportedUser.firstName} ${reportedUser.lastName}`;
      reportType = 'User';
    } else {
      // Organization-level report
      reportedName = reportedMember.organisationInfo?.companyName || reportDto.reportedMemberId;
      reportType = 'Organization';
    }

    const confirmationParams = {
      reporterName,
      reportType,
      reportedName,
      reportedCompany: reportedMember.organisationInfo?.companyName || 'N/A',
      timestamp: new Date().toLocaleString(),
      adminEmail: this.adminEmail,
    };

    try {
      this.logger.log(`Attempting to send confirmation email to: ${reporterEmail}`);
      this.logger.debug(`Confirmation params: ${JSON.stringify(confirmationParams)}`);
      
      await this.emailService.sendTemplatedEmail({
        to: reporterEmail,
        templateCode: EmailTemplateCode.MEMBER_REPORT_CONFIRMATION,
        params: confirmationParams,
        language: SupportedLanguage.ENGLISH,
      });

      this.logger.log(`✅ Confirmation email sent successfully to reporter: ${reporterEmail}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send confirmation email to ${reporterEmail}`);
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      this.logger.error(`Error message: ${error instanceof Error ? error.message : String(error)}`);
      // Log but don't throw - confirmation email failure shouldn't fail the report
    }
  }
}
