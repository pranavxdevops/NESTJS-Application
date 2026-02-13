import { Injectable, NotFoundException } from "@nestjs/common";
import { MemberRepository } from "../../repository/member.repository";
import { UserService } from "@modules/user/user.service";
import { GeocodingService } from "@shared/geocoding/geocoding.service";
import { WorkflowNotificationService } from "../services/workflow-notification.service";
import { BasePhaseHandler } from "./base.handler";
import {
  MemberWorkflowContext,
  MemberWorkflowPhases,
  MemberWorkflowResult,
} from "../interfaces/workflow.interface";
import { UpdateMemberDto } from "../../dto/update-member.dto";
import { Member, UserSnapshot } from "../../schemas/member.schema";
import { createDeepMergeUpdate } from "@shared/common/object-merge.util";

/**
 * Handles Phase 3: Post-Approval Updates
 *
 * Responsibilities:
 * - Add additional users to active members
 * - Update questionnaire responses
 * - Add supplementary information
 * - Does NOT change member status
 *
 * This phase is for members who are already approved and active
 */
@Injectable()
export class Phase3Handler extends BasePhaseHandler {
  constructor(
    memberRepository: MemberRepository,
    userService: UserService,
    geocodingService: GeocodingService,
    notificationService: WorkflowNotificationService,
  ) {
    super(memberRepository, userService, geocodingService, notificationService);
  }

  /**
   * Execute Phase 3 updates
   */
  async execute(memberId: string, dto: UpdateMemberDto): Promise<MemberWorkflowResult> {
    this.logger.log(`Executing Phase 3: Post-Approval Updates for ${memberId}`);

    try {
      // Step 1: Find existing member
      const existingMember = await this.memberRepository.findOne({ memberId });
      if (!existingMember) {
        throw new NotFoundException(`Member with ID ${memberId} not found`);
      }

      // Step 2: Validate member is approved/active
      if (existingMember.status !== "active") {
        return {
          success: false,
          entity: existingMember,
          phase: MemberWorkflowPhases.PHASE_2_COMPLETION, // No specific Phase 3 phase
          error: `Phase 3 updates only allowed for active members. Current status: ${existingMember.status}`,
        };
      }

      // Step 3: Update/add member users if provided
      let userSnapshots = existingMember.userSnapshots || [];
      if (dto.memberUsers && dto.memberUsers.length > 0) {
        userSnapshots = await this.updateOrAddMemberUsers(dto.memberUsers, memberId, userSnapshots);
      }

      // Step 4: Update member record
      const updatedMember = await this.updateMember(memberId, dto, userSnapshots);

      this.logger.log(`Phase 3 updates completed successfully for ${updatedMember.memberId}`);

      return {
        success: true,
        entity: updatedMember,
        phase: MemberWorkflowPhases.PHASE_2_COMPLETION, // Using existing phase
        message: "Member information updated successfully.",
      };
    } catch (error) {
      this.logger.error(
        `Phase 3 execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
   * Handle Phase 3 via workflow context
   */
  async handle(context: MemberWorkflowContext): Promise<MemberWorkflowResult> {
    const { entityId, data } = context;
    if (!entityId) {
      return {
        success: false,
        entity: {} as Member,
        phase: MemberWorkflowPhases.PHASE_2_COMPLETION,
        error: "Member ID is required for Phase 3",
      };
    }

    const dto = data as UpdateMemberDto;
    return this.execute(entityId, dto);
  }

  /**
   * Update member record with Phase 3 data
   * Uses deep merge to preserve existing nested data
   * Does NOT change status - member remains active
   */
  private async updateMember(
    memberId: string,
    dto: UpdateMemberDto,
    userSnapshots: UserSnapshot[],
  ): Promise<Member> {
    // Remove phase indicator from update data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { phase, ...updateData } = dto;

    // Create update object using deep merge strategy
    // This preserves existing nested fields while updating provided ones
    const updateFields = createDeepMergeUpdate(updateData as Record<string, unknown>);

    // Add or update userSnapshots
    updateFields.userSnapshots = userSnapshots;

    // Do NOT set status - member remains in current state during Phase 3

    await this.memberRepository.updateOne({ memberId }, { $set: updateFields });

    const updatedMember = await this.memberRepository.findOne({ memberId });
    if (!updatedMember) {
      throw new NotFoundException(`Member with ID ${memberId} not found after update`);
    }

    return updatedMember;
  }
}
