import { Injectable } from "@nestjs/common";
import { MemberRepository } from "../../repository/member.repository";
import { UserService } from "@modules/user/user.service";
import { GeocodingService } from "@shared/geocoding/geocoding.service";
import { WorkflowNotificationService } from "../services/workflow-notification.service";
import { BasePhaseHandler } from "./base.handler";
import {
  IPhase1Handler,
  MemberWorkflowContext,
  MemberWorkflowPhases,
  MemberWorkflowResult,
} from "../interfaces/workflow.interface";
import { CreateMemberDto } from "../../dto/create-member.dto";
import { Member } from "../../schemas/member.schema";

/**
 * Handles Phase 1: Initial Application Submission
 *
 * Responsibilities:
 * - Create member record with auto-generated IDs
 * - Geocode address
 * - Create/update member users
 * - Send Phase 1 confirmation email with Phase 2 link
 */
@Injectable()
export class Phase1Handler extends BasePhaseHandler implements IPhase1Handler {
  constructor(
    memberRepository: MemberRepository,
    userService: UserService,
    geocodingService: GeocodingService,
    notificationService: WorkflowNotificationService
  ) {
    super(memberRepository, userService, geocodingService, notificationService);
  }

  getPhase(): string {
    return MemberWorkflowPhases.PHASE_1_APPLICATION;
  }

  canHandle(context: MemberWorkflowContext): boolean {
    return context.phase === MemberWorkflowPhases.PHASE_1_APPLICATION;
  }

  async handle(context: MemberWorkflowContext): Promise<MemberWorkflowResult> {
    const dto = context.data as CreateMemberDto;
    return this.execute(dto);
  }

  async execute(dto: CreateMemberDto): Promise<MemberWorkflowResult> {
    this.logger.log("Executing Phase 1: Initial Application");

    try {
      // Step 2: Create member with pendingFormSubmission status
      const member = await this.createMember(dto);

      // Step 3: Create/update users and link to member
      const updatedMember = await this.createMemberUsers(dto, member);

      // Step 4: Send Phase 1 confirmation email
      this.notificationService.sendPhase1Confirmation(updatedMember);

      this.logger.log(
        `Phase 1 completed successfully for ${updatedMember.memberId} (${updatedMember.applicationNumber})`,
      );

      return {
        success: true,
        entity: updatedMember,
        phase: MemberWorkflowPhases.PHASE_1_APPLICATION,
        nextPhase: MemberWorkflowPhases.PHASE_2_COMPLETION,
        message: "Phase 1 application submitted successfully. Please complete Phase 2.",
      };
    } catch (error) {
      this.logger.error(
        `Phase 1 execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.PHASE_1_APPLICATION,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create member record
   * Status is always set to 'pendingFormSubmission' for Phase 1
   */
  private async createMember(dto: CreateMemberDto): Promise<Member> {
    return this.memberRepository.create({
      userSnapshots: [],
      category: dto.category,
      tier: dto.tier,
      status: "pendingFormSubmission",
      organisationInfo: dto.organisationInfo,
      memberConsent: dto.memberConsent,
      approvalHistory: [],
      rejectionHistory: [],
      paymentStatus: "pending",
      deletedAt: null,
    });
  }

  /**
   * Create/update member users and link them to the member
   */
  private async createMemberUsers(dto: CreateMemberDto, member: Member): Promise<Member> {
    if (!dto.memberUsers || dto.memberUsers.length === 0) {
      return member;
    }

    const userSnapshots = await this.processUsers(dto.memberUsers, member.memberId);

    // Update member with user snapshots
    await this.memberRepository.updateOne(
      { memberId: member.memberId },
      { $set: { userSnapshots } },
    );

    return { ...member, userSnapshots };
  }
}
