import { PartialType, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { CreateMemberDto } from "./create-member.dto";

/**
 * Workflow phase indicator for update operations
 */
export enum UpdatePhase {
  PHASE_1 = "phase1", // Basic registration
  PHASE_2 = "phase2", // Complete application (no user addition)
  PHASE_3 = "phase3", // Post-approval updates (add users, questionnaires)
  GENERAL = "general", // General updates (no workflow context)
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
   @ApiPropertyOptional({
  enum: ['save', 'submit'],
    description: "Use 'save' for draft, 'submit' for final submission",
    example: 'submit'
  })
  @IsOptional()
  @IsEnum(['save', 'submit'])
  action?: "save" | "submit";  // <--- ADDED HERE ✔️
  @ApiPropertyOptional({
    description: "Workflow phase indicator for the update operation",
    enum: UpdatePhase,
    example: UpdatePhase.PHASE_2,
  })
  @IsEnum(UpdatePhase)
  @IsOptional()
  phase?: UpdatePhase;

  @ApiPropertyOptional({
    description: "Whether this member should be featured on the website",
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  featuredMember?: boolean;
}
