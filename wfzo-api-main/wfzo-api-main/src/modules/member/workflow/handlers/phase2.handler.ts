import { Injectable, NotFoundException } from "@nestjs/common";
import { MemberRepository } from "../../repository/member.repository";
import { UserService } from "@modules/user/user.service";
import { GeocodingService } from "@shared/geocoding/geocoding.service";
import { WorkflowNotificationService } from "../services/workflow-notification.service";
import { BasePhaseHandler } from "./base.handler";
import {
  IPhase2Handler,
  MemberWorkflowContext,
  MemberWorkflowPhases,
  MemberWorkflowResult,
} from "../interfaces/workflow.interface";
import { UpdateMemberDto } from "../../dto/update-member.dto";
import { Member } from "../../schemas/member.schema";
import { createDeepMergeUpdate } from "@shared/common/object-merge.util";

/**
 * Handles Phase 2: Application Completion
 *
 * Responsibilities:
 * - Update member with complete details
 * - Geocode updated address
 * - Update member users
 * - Change status to pendingCommitteeApproval
 * - Send Phase 2 confirmation emails (to member and admin)
 */
@Injectable()
export class Phase2Handler extends BasePhaseHandler implements IPhase2Handler {
  constructor(
    memberRepository: MemberRepository,
    userService: UserService,
    geocodingService: GeocodingService,
    notificationService: WorkflowNotificationService,
  ) {
    super(memberRepository, userService, geocodingService, notificationService);
  }

  getPhase(): string {
    return MemberWorkflowPhases.PHASE_2_COMPLETION;
  }

  canHandle(context: MemberWorkflowContext): boolean {
    return context.phase === MemberWorkflowPhases.PHASE_2_COMPLETION;
  }

  async handle(context: MemberWorkflowContext): Promise<MemberWorkflowResult> {
    const { entityId, data } = context;
    if (!entityId) {
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.PHASE_2_COMPLETION,
        error: "Member ID is required for Phase 2",
      };
    }

    const dto = data as UpdateMemberDto;
    return this.execute(entityId, dto);
  }

  async execute(memberId: string, dto: UpdateMemberDto): Promise<MemberWorkflowResult> {
    this.logger.log(`Executing Phase 2: Completion for ${memberId}`);

    try {
      // Step 1: Find existing member
      const existingMember = await this.memberRepository.findOne({ memberId });
      if (!existingMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }
      // Step 1: Geocode address if provided
      await this.geocodeAddress(dto);
      // Step 2: Update member record with Phase 2 data
      // NOTE: Phase 2 does NOT update users - users are set in Phase 1 only
      // User additions happen in Phase 3 (post-approval)
      const updatedMember = await this.updateMember(memberId, dto);

      // Step 3: Send Phase 2 confirmation emails
      this.notificationService.sendPhase2Confirmation(updatedMember);

      this.logger.log(`Phase 2 completed successfully for ${updatedMember.memberId}`);

      return {
        success: true,
        entity: updatedMember,
        phase: MemberWorkflowPhases.PHASE_2_COMPLETION,
        nextPhase: MemberWorkflowPhases.COMMITTEE_APPROVAL,
        message: "Phase 2 completed. Application submitted for Committee approval.",
      };
    } catch (error) {
      this.logger.error(
        `Phase 2 execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.PHASE_2_COMPLETION,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update member record with Phase 2 data and change status
   * Uses deep merge to preserve existing nested data while only updating provided fields
   * NOTE: Does NOT update user snapshots - those are managed in Phase 1 and Phase 3
   */
  private async updateMember(memberId: string, dto: UpdateMemberDto): Promise<Member> {
    // Remove memberUsers and phase from update data (shouldn't be in Phase 2)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { memberUsers, phase, ...updateData } = dto;

    // Create update object using deep merge strategy
    // This ensures undefined values don't overwrite existing nested fields
    const updateFields = createDeepMergeUpdate(updateData as Record<string, unknown>);

    // Always set status to transition to next phase
    updateFields.status = "pendingCommitteeApproval";

    // Use MongoDB's dot notation to update only the fields that were provided
    // Nested fields like organisationInfo.companyName will be preserved if not in updateData
    await this.memberRepository.updateOne({ memberId }, { $set: updateFields });

    const updatedMember = await this.memberRepository.findOne({ memberId });
    if (!updatedMember) {
      throw new NotFoundException(`Member with ID ${memberId} not found after update`);
    }

    return updatedMember;
  }
}
