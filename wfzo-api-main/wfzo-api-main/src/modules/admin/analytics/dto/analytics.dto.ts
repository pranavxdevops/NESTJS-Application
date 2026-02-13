import { ApiProperty } from "@nestjs/swagger";

export class MembersByContinentDto {
  @ApiProperty({ description: "Continent name", example: "Asia" })
  continent!: string;

  @ApiProperty({ description: "Number of members", example: 125 })
  count!: number;

  @ApiProperty({ description: "Percentage of total", example: 35.5 })
  percentage!: number;
}

export class MembershipRequestsTimelineDto {
  @ApiProperty({ description: "Period label", example: "2025-01" })
  period!: string;

  @ApiProperty({ description: "Number of requests", example: 15 })
  count!: number;

  @ApiProperty({ description: "Number of approved requests", example: 12 })
  approved!: number;

  @ApiProperty({ description: "Number of pending requests", example: 3 })
  pending!: number;

  @ApiProperty({ description: "Number of rejected requests", example: 0 })
  rejected!: number;
}

export class MemberGrowthDto {
  @ApiProperty({ description: "Period label", example: "2025-01" })
  period!: string;

  @ApiProperty({ description: "Cumulative member count", example: 234 })
  totalMembers!: number;

  @ApiProperty({ description: "New members in this period", example: 15 })
  newMembers!: number;
}

export class EnquiriesTimelineDto {
  @ApiProperty({ description: "Period label", example: "2025-01" })
  period!: string;

  @ApiProperty({ description: "Total enquiries", example: 25 })
  total!: number;

  @ApiProperty({ description: "Pending enquiries", example: 10 })
  pending!: number;

  @ApiProperty({ description: "Approved enquiries", example: 12 })
  approved!: number;

  @ApiProperty({ description: "Rejected enquiries", example: 3 })
  rejected!: number;
}
