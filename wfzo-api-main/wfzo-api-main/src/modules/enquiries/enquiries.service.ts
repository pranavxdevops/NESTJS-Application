import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailService } from "@shared/email/email.service";
import { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import { UpdateEnquiryDto } from "./dto/update-enquiry.dto";
import { EnquiriesRepository } from "./repository/enquiries.repository";
import { Enquiry, EnquiryStatus, EnquiryType } from "./schemas/enquiry.schema";
import { EmailTemplateCode, SupportedLanguage } from "@shared/email/schemas/email-template.schema";

@Injectable()
export class EnquiriesService {
  private readonly logger = new Logger(EnquiriesService.name);

  constructor(
    private readonly repo: EnquiriesRepository,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async createEnquiry(dto: CreateEnquiryDto): Promise<Enquiry> {
    // Optional: Add business logic, e.g., validate conditional fields
    if (dto.enquiryType === EnquiryType.SUBMIT_QUESTION && !dto.subject) {
      throw new Error("Subject is required for submit_question type");
    }

    const enquiry = await this.repo.create(dto);

    // Send notification to admin (non-blocking)
    const adminEmail = this.configService.get<string>("WFZO_ADMIN_EMAIL") || "admin@wfzo.org";
    try {
      // Use void to make lint happy about the intentionally un-awaited promise
      void this.emailService
        .sendEmail({
          to: adminEmail,
          subject: `New Enquiry: ${dto.enquiryType}`,
          htmlBody: `
            <h1>New Enquiry Received</h1>
            <p><strong>Type:</strong> ${dto.enquiryType}</p>
            ${dto.userDetails ? `<p><strong>User:</strong> ${dto.userDetails.firstName} ${dto.userDetails.lastName}</p>` : ""}
            ${dto.userDetails?.email ? `<p><strong>Email:</strong> ${dto.userDetails.email}</p>` : ""}
            ${dto.userDetails?.organizationName ? `<p><strong>Organization:</strong> ${dto.userDetails.organizationName}</p>` : ""}
            ${dto.userDetails?.country ? `<p><strong>Country:</strong> ${dto.userDetails.country}</p>` : ""}
            ${dto.userDetails?.phoneNumber ? `<p><strong>Phone:</strong> ${dto.userDetails.phoneNumber}</p>` : ""}
            ${dto.subject ? `<p><strong>Subject:</strong> ${dto.subject}</p>` : ""}
            ${dto.noOfMembers ? `<p><strong>No. of Additional Members:</strong> ${dto.noOfMembers}</p>` : ""}
            <p><strong>Message:</strong> ${dto.message}</p>
          `,
        })
        .then(() => this.logger.log(`Admin notification email sent to ${adminEmail}`))
        .catch((error) =>
          this.logger.error(`Failed to send admin notification email to ${adminEmail}`, error),
        );

      // Also send an acknowledgement email to the user who submitted the enquiry (if email present)
      // Skip for be-a-featured-member enquiry type
      const userEmail = dto.userDetails?.email;
      if (userEmail && dto.enquiryType !== EnquiryType.BECOME_FEATURED_MEMBER) {
        try {
          void this.emailService
            .sendEmail({
              to: userEmail,
              subject: `We received your enquiry`,
              htmlBody: `
                <h1>Thank you</h1>
                <p>Dear ${dto.userDetails?.firstName ?? "user"},</p>
                <p>We have received your enquiry regarding <strong>${dto.enquiryType}</strong> and our team will get back to you shortly.</p>
                ${dto.subject ? `<p><strong>Subject:</strong> ${dto.subject}</p>` : ""}
                <p><strong>Message:</strong></p>
                <blockquote>${dto.message}</blockquote>
                <p>Best regards,<br/>WFZO Team</p>
              `,
            })
            .then(() => this.logger.log(`User acknowledgement email sent to ${userEmail}`))
            .catch((error) =>
              this.logger.error(`Failed to send user acknowledgement email to ${userEmail}`, error),
            );
        } catch (error) {
          this.logger.error(
            `Unexpected error initiating user acknowledgement email to ${userEmail}`,
            error,
          );
        }
      } else if (!userEmail) {
        this.logger.warn(`No user email provided in enquiry, skipping acknowledgement email`);
      }
    } catch (error) {
      // Defensive: catch synchronous errors (if any) while initiating the send
      this.logger.error(
        `Unexpected error initiating admin notification email to ${adminEmail}`,
        error,
      );
    }

    return enquiry;
  }

  async findEnquiryById(id: string): Promise<Enquiry> {
    const enquiry = await this.repo.findById(id);
    if (!enquiry) {
      throw new Error(`Enquiry with ID ${id} not found`);
    }
    return enquiry;
  }

  async updateEnquiry(id: string, dto: UpdateEnquiryDto): Promise<Enquiry> {
    const enquiry = await this.findEnquiryById(id);

    // Only allow updates if current status is pending
    if (enquiry.enquiryStatus !== EnquiryStatus.PENDING) {
      throw new Error("Can only update pending enquiries");
    }

    const updatedData = {
      enquiryStatus: dto.enquiryStatus,
      ...(dto.comments && { comments: dto.comments }),
    };

    const updatedEnquiry = await this.repo.update(id, updatedData);

    // Send status update email to organization (user email)
    const userEmail = enquiry.userDetails?.email;
    if (!userEmail) {
      this.logger.warn(`No user email found for enquiry ${id}, skipping status email`);
      return updatedEnquiry;
    }

    const templateCodeMap: Record<EnquiryStatus, EmailTemplateCode> = {
      [EnquiryStatus.APPROVED]: EmailTemplateCode.ENQUIRY_APPROVED as EmailTemplateCode,
      [EnquiryStatus.REJECTED]: EmailTemplateCode.ENQUIRY_REJECTED as EmailTemplateCode,
      [EnquiryStatus.PENDING]: EmailTemplateCode.ENQUIRY_APPROVED as EmailTemplateCode, // fallback, shouldn't happen
    };

    const templateCode = templateCodeMap[dto.enquiryStatus];
    if (!templateCode) {
      throw new BadRequestException(`Invalid enquiry status: ${dto.enquiryStatus}`);
    }

    this.logger.log(`Sending enquiry status email of type ${dto.enquiryStatus} to ${userEmail}`);

    // Build email parameters
    const emailParams: Record<string, any> = {
      firstName: enquiry.userDetails?.firstName,
      lastName: enquiry.userDetails?.lastName,
      organizationName: enquiry.userDetails?.organizationName,
      enquiryType: enquiry.enquiryType,
      status: dto.enquiryStatus,
    };

    if (dto.comments) emailParams.comments = dto.comments;

    // Send email asynchronously (non-blocking)
    try {
      void this.emailService
        .sendTemplatedEmail({
          templateCode,
          language: SupportedLanguage.ENGLISH,
          to: userEmail,
          params: emailParams,
        })
        .then(() => this.logger.log(`Enquiry status email sent successfully to ${userEmail}`))
        .catch((error) =>
          this.logger.error(`Failed to send enquiry status email to ${userEmail}:`, error),
        );
    } catch (error) {
      // Defensive: catch synchronous errors (if any) while initiating the send
      this.logger.error(
        `Unexpected error initiating enquiry status email to ${userEmail}`,
        error,
      );
    }

    return updatedEnquiry;
  }

  async findEnquiriesByType(enquiryType?: string): Promise<Enquiry[]> {
    const filter = enquiryType ? { enquiryType } : {};
    const page = { page: 1, pageSize: 50 };
    const result = await this.repo.findAll(filter, page);
    return result.items;
  }

  async findEnquiriesByMember(memberId: string, enquiryType?: string): Promise<Enquiry[]> {
    const filter = { memberId, ...(enquiryType && { enquiryType }) };
    const page = { page: 1, pageSize: 50 };
    const result = await this.repo.findAll(filter, page);
    return result.items;
  }
}
