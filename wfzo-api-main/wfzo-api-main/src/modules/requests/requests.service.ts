import { BadRequestException, Injectable, NotFoundException, Logger } from "@nestjs/common";
import { RequestsRepository } from "./repository/requests.repository";
import { CreateRequestDto } from "./dto/create-request.dto";
import { UpdateRequestDto } from "./dto/update-request.dto";
import { SaveDraftRequestDto } from "./dto/save-draft-request.dto";
import { Request, RequestStatus } from "./schemas/request.schema";
import { MemberService } from "@modules/member/member.service";
import { EmailService } from "@shared/email/email.service";
import { ConfigService } from "@nestjs/config";

/**
 * RequestsService handles the business logic for organizationInfo update requests
 * Manages creation, approval/rejection workflow, and validations
 */
@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    private readonly repo: RequestsRepository,
    private readonly memberService: MemberService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // Render an object as nested HTML key-value lists for human-readable emails
  private escapeHtml(input: string): string {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private formatOrgInfoAsHtml(obj: any): string {
    if (obj === null || obj === undefined) return "<div><em>None</em></div>";

    const render = (value: any): string => {
      if (value === null || value === undefined) return "<em>null</em>";
      if (Array.isArray(value)) {
        if (value.length === 0) return "<div>[]</div>";
        return `<ol>${value
          .map((v) => `<li>${typeof v === "object" ? render(v) : this.escapeHtml(String(v))}</li>`)
          .join("")}</ol>`;
      }
      if (typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.length === 0) return "<div>{}</div>";
        return `<ul>${entries
          .map(
            ([k, v]) =>
              `<li><strong>${this.escapeHtml(k)}</strong>: ${typeof v === "object" ? render(v) : this.escapeHtml(String(v ?? ""))}</li>`,
          )
          .join("")}</ul>`;
      }
      // primitive
      return this.escapeHtml(String(value));
    };

    return render(obj);
  }

  /**
   * Create a new organizationInfo update request
   * Only users can create requests with PENDING status
   *
   * Validations:
   * - Member must exist in members collection
   * - requestStatus must be PENDING (enforced server-side)
   * - organizationInfo and memberId are required
   *
   * @throws BadRequestException if member not found or invalid status
   */
  async createRequest(dto: CreateRequestDto): Promise<Request> {
    // Validate member exists
    let member;
    try {
      member = await this.memberService.findOne(dto.memberId);
    } catch (err) {
      throw new BadRequestException(
        `Member with ID "${dto.memberId}" not found. Please provide a valid memberId from the members collection.`,
      );
    }

    // Prepare payload for PENDING submission
    const payload: Partial<Request> = {
      organisationInfo: dto.organisationInfo,
      memberId: dto.memberId,
      requestStatus: RequestStatus.PENDING,
      comments: null,
    };

    // If a DRAFT exists for this member, update it to become the PENDING request
    const existing = await this.repo.findOne({ memberId: dto.memberId } as any);
    let created: Request;
    if (existing) {
        const updated = await this.repo.updateById((existing as any)._id, payload as any);
        if (!updated) {
          throw new BadRequestException("Failed to submit draft request.");
        }
        created = updated;
      
    } else {
      // No existing request — create a fresh one
      created = await this.repo.create(payload);
    }

    // Send notification emails: admin + user (non-blocking)
    const adminEmail = this.configService.get<string>("WFZO_ADMIN_EMAIL");

    // user email - prefer member snapshot email if available
    const userEmail =
      member?.userSnapshots && member.userSnapshots.length > 0
        ? (member.userSnapshots[0].email as string | undefined)
        : undefined;

    // Email to admin with request details
    if (adminEmail) {
      try {
        void this.emailService
          .sendEmail({
            to: adminEmail,
            subject: `New OrganisationInfo Update Request from ${created.memberId}`,
            htmlBody: `
              <h1>New OrganisationInfo Update Request</h1>
              <p><strong>Request ID:</strong> ${String((created as any)._id)}</p>
              <p><strong>Member ID:</strong> ${created.memberId}</p>
              <p><strong>Submitted at:</strong> ${String((created as any).createdAt)}</p>
              <h2>Requested organisationInfo</h2>
              ${this.formatOrgInfoAsHtml(created.organisationInfo)}
              <p>View in admin portal: <em>/requests/${String((created as any)._id)}</em></p>
            `,
          })
          .then(() => this.logger.log(`Admin notification email sent to ${adminEmail}`))
          .catch((error) =>
            this.logger.error(`Failed sending admin email to ${adminEmail}`, error),
          );
      } catch (error) {
        this.logger.error(`Unexpected error initiating admin email to ${adminEmail}`, error);
      }
    } else {
      this.logger.warn("WFZO_ADMIN_EMAIL not configured - skipping admin notification email");
    }

    // Email to user (if email present)
    if (userEmail) {
      try {
        void this.emailService
          .sendEmail({
            to: userEmail,
            subject: `Your OrganisationInfo update request has been submitted`,
            htmlBody: `
              <h1>Request submitted</h1>
              <p>Dear user,</p>
              <p>Your request to update organisation information has been submitted and is pending admin approval.</p>
              <h2>Requested changes</h2>
              ${this.formatOrgInfoAsHtml(created.organisationInfo)}
              <p>We will notify you once an admin approves or rejects the request.</p>
            `,
          })
          .then(() => this.logger.log(`User notification email sent to ${userEmail}`))
          .catch((error) => this.logger.error(`Failed sending user email to ${userEmail}`, error));
      } catch (error) {
        this.logger.error(`Unexpected error initiating user email to ${userEmail}`, error);
      }
    } else {
      this.logger.warn(
        `No user email found for member ${dto.memberId}, skipping user notification`,
      );
    }

    return created;
  }

  /**
   * Save a draft request
   * Users can save incomplete organizationInfo updates as drafts without validation
   * No member existence check required for drafts
   * No notification emails sent for drafts
   *
   * @throws BadRequestException if validation fails
   */
  async saveDraft(dto: SaveDraftRequestDto): Promise<Request> {
    // Upsert draft: if a DRAFT exists for this member, update it; otherwise create new DRAFT
    const payload: Partial<Request> = {
      organisationInfo: dto.organisationInfo,
      memberId: dto.memberId,
      requestStatus: RequestStatus.DRAFT,
      comments: null,
    };

    const existing = await this.repo.findOne({ memberId: dto.memberId } as any);
    if (existing) {
      if (existing.requestStatus === RequestStatus.DRAFT) {
        const updated = await this.repo.updateById((existing as any)._id, payload as any);
        if (!updated) {
          throw new BadRequestException("Failed to update draft request.");
        }
        this.logger.log(`Draft request updated for member ${dto.memberId}`);
        return updated;
      }
      // If there is an existing non-draft request, update organisationInfo and set to DRAFT
      const updatedOther = await this.repo.updateById((existing as any)._id, payload as any);
      if (!updatedOther) {
        throw new BadRequestException("Failed to create/update draft request.");
      }
      this.logger.log(`Request for member ${dto.memberId} converted to DRAFT`);
      return updatedOther;
    }

    const created = await this.repo.create(payload);
    this.logger.log(`Draft request created for member ${dto.memberId}`);
    return created;
  }

  /**
   * Update request status (admin only)
   * Transitions: PENDING → APPROVED or PENDING → REJECTED
   *
   * Validations:
   * - Request must exist
   * - When setting to APPROVED or REJECTED, comments are mandatory
   * - When setting to PENDING, comments must be null/empty
   *
   * @throws NotFoundException if request not found
   * @throws BadRequestException if validation fails
   */
  async updateRequest(id: string, dto: UpdateRequestDto): Promise<Request> {
    // Load existing request
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundException(
        `Request with ID "${id}" not found. Ensure the request ID is valid.`,
      );
    }

    // Validate comments based on status transition
    if (
      dto.requestStatus === RequestStatus.APPROVED ||
      dto.requestStatus === RequestStatus.REJECTED
    ) {
      // Comments required and must not be empty
      if (!dto.comments || dto.comments.trim() === "") {
        throw new BadRequestException(
          `Comments are required and cannot be empty when ${dto.requestStatus.toLowerCase()}ing a request.`,
        );
      }
    }

    if (dto.requestStatus === RequestStatus.PENDING) {
      // If reverting to PENDING, comments should be cleared
      if (dto.comments && dto.comments.trim() !== "") {
        throw new BadRequestException(
          "Comments must be empty when reverting request status to PENDING.",
        );
      }
    }

    // Update request
    const updatePayload: Partial<Request> = {
      requestStatus: dto.requestStatus,
      comments: dto.requestStatus === RequestStatus.PENDING ? null : (dto.comments ?? null),
    };

    const updated = await this.repo.updateById(id, updatePayload);
    if (!updated) {
      throw new NotFoundException("Failed to update request.");
    }

    // When approving a request, apply the requested organisationInfo changes to the member record.
    if (dto.requestStatus === RequestStatus.APPROVED) {
      try {
        // Use genericUpdate so organisationInfo is merged (not replaced) and business rules are respected
        await this.memberService.genericUpdate(existing.memberId, {
          organisationInfo: existing.organisationInfo,
        });
      } catch (err) {
        // Attempt to rollback the request status to previous value to avoid inconsistent state
        try {
          await this.repo.updateById(id, {
            requestStatus: existing.requestStatus,
            comments: existing.comments ?? null,
          });
        } catch (rollbackErr) {
          // If rollback fails, log via thrown error; let the original error bubble as BadRequest
          this.logger.error("Rollback failed after member update failure", rollbackErr as any);
        }
        throw new BadRequestException(
          `Failed to update member organisationInfo: ${(err as any)?.message ?? String(err)}`,
        );
      }
    }

    // Notify admin and user about status change (non-blocking)
    try {
      const adminEmail = this.configService.get<string>("WFZO_ADMIN_EMAIL");

      // Try to fetch member to get user email; if not found, continue without user email
      let member: any | undefined;
      try {
        member = await this.memberService.findOne(existing.memberId);
      } catch (err) {
        this.logger.warn(`Member ${existing.memberId} not found while sending notification emails`);
      }

      const userEmail =
        member?.userSnapshots && member.userSnapshots.length > 0
          ? (member.userSnapshots[0].email as string | undefined)
          : undefined;

      const statusText = dto.requestStatus;
      const comments = dto.comments ?? "";

      // Send email to admin
      // if (adminEmail) {
      //   try {
      //     void this.emailService
      //       .sendEmail({
      //         to: adminEmail,
      //         subject: `Request ${statusText} - ${existing.memberId}`,
      //         htmlBody: `
      //         <h1>Request ${statusText}</h1>
      //         <p>Request ID: <strong>${String((updated as any)._id ?? id)}</strong></p>
      //         <p>Member ID: <strong>${existing.memberId}</strong></p>
      //         <p>Status: <strong>${statusText}</strong></p>
      //         ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ""}
      //         <p>View in admin portal: <em>/requests/${String((updated as any)._id ?? id)}</em></p>
      //       `,
      //       })
      //       .then(() => this.logger.log(`Admin notification email sent to ${adminEmail}`))
      //       .catch((error) =>
      //         this.logger.error(`Failed sending admin email to ${adminEmail}`, error),
      //       );
      //   } catch (error) {
      //     this.logger.error(`Unexpected error initiating admin email to ${adminEmail}`, error);
      //   }
      // } else {
      //   this.logger.warn("WFZO_ADMIN_EMAIL not configured - skipping admin notification email");
      // }

      // Send email to user (if email present)
      if (userEmail) {
        try {
          void this.emailService
            .sendEmail({
              to: userEmail,
              subject: `Your OrganisationInfo update request has been ${statusText.toLowerCase()}`,
              htmlBody: `
              <h1>Request ${statusText}</h1>
              <p>Dear user,</p>
              <p>Your request to update organisation information </strong>) has been <strong>${statusText.toLowerCase()}</strong>.</p>
              ${comments ? `<p><strong>Comments from admin:</strong> ${comments}</p>` : ""}
              <p>Thank you.</p>
            `,
            })
            .then(() => this.logger.log(`User notification email sent to ${userEmail}`))
            .catch((error) =>
              this.logger.error(`Failed sending user email to ${userEmail}`, error),
            );
        } catch (error) {
          this.logger.error(`Unexpected error initiating user email to ${userEmail}`, error);
        }
      } else {
        this.logger.warn(
          `No user email found for member ${existing.memberId}, skipping user notification`,
        );
      }
    } catch (err) {
      // Defensive catch-all to ensure email errors don't affect main flow
      this.logger.error(`Failed to send notification emails for request ${id}:`, err as any);
    }

    return updated;
  }

  /**
   * Get request by ID
   * @throws NotFoundException if request not found
   */
  async findById(id: string): Promise<Request> {
    const request = await this.repo.findById(id);
    if (!request) {
      throw new NotFoundException(
        `Request with ID "${id}" not found. Ensure the request ID is valid.`,
      );
    }
    return request;
  }

  /**
   * List requests with optional filtering by status only
   * Pagination is handled server-side with defaults (page=1, pageSize=20)
   */
  async findAll(status?: string) {
    if (status) {
      // Validate status
      if (!Object.values(RequestStatus).includes(status as RequestStatus)) {
        throw new BadRequestException(
          `Invalid status. Must be one of: ${Object.values(RequestStatus).join(", ")}`,
        );
      }
      return this.repo.findByStatus(status);
    }

    // No status filter — return all with default pagination
    return this.repo.findAll({ deletedAt: null } as any, { page: 1, pageSize: 20 });
  }

  /**
   * Get all requests sent to admin by a specific member
   * Returns array of requests without pagination wrapper
   */
  async findByMemberId(memberId: string) {
    const result = await this.repo.findByMemberId(memberId);
    return result.items || [];
  }
}
