import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import {
  MembersByContinentDto,
  MembershipRequestsTimelineDto,
  MemberGrowthDto,
  EnquiriesTimelineDto,
} from "./dto/analytics.dto";

@ApiTags("Analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("members-by-continent")
  @ApiOperation({
    summary: "Get total members per continent",
    description: "Returns aggregated count of members grouped by continent",
  })
  @ApiOkResponse({
    description: "Members count by continent",
    type: [MembersByContinentDto],
  })
  async getMembersByContinent(): Promise<MembersByContinentDto[]> {
    return this.analyticsService.getMembersByContinent();
  }

  @Get("membership-requests")
  @ApiOperation({
    summary: "Get membership requests timeline",
    description: "Returns membership requests aggregated by time period (daily/weekly/monthly/yearly)",
  })
  @ApiQuery({
    name: "period",
    enum: ["daily", "weekly", "monthly", "yearly"],
    required: false,
    description: "Time period for aggregation (default: monthly)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of periods to return (default: 12 for monthly, 7 for daily, 52 for weekly, 5 for yearly)",
  })
  @ApiOkResponse({
    description: "Membership requests timeline",
    type: [MembershipRequestsTimelineDto],
  })
  async getMembershipRequestsTimeline(
    @Query("period") period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    @Query("limit") limit?: number,
  ): Promise<MembershipRequestsTimelineDto[]> {
    return this.analyticsService.getMembershipRequestsTimeline(period, limit);
  }

  @Get("member-growth")
  @ApiOperation({
    summary: "Get member growth over time",
    description: "Returns cumulative member count growth over time",
  })
  @ApiQuery({
    name: "period",
    enum: ["daily", "weekly", "monthly", "yearly"],
    required: false,
    description: "Time period for aggregation (default: monthly)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of periods to return (default: 12)",
  })
  @ApiOkResponse({
    description: "Member growth timeline",
    type: [MemberGrowthDto],
  })
  async getMemberGrowth(
    @Query("period") period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    @Query("limit") limit?: number,
  ): Promise<MemberGrowthDto[]> {
    return this.analyticsService.getMemberGrowth(period, limit);
  }

  @Get("enquiries")
  @ApiOperation({
    summary: "Get enquiries timeline",
    description: "Returns enquiries aggregated by time period (daily/weekly/monthly/yearly)",
  })
  @ApiQuery({
    name: "period",
    enum: ["daily", "weekly", "monthly", "yearly"],
    required: false,
    description: "Time period for aggregation (default: monthly)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of periods to return (default: 12)",
  })
  @ApiOkResponse({
    description: "Enquiries timeline",
    type: [EnquiriesTimelineDto],
  })
  async getEnquiriesTimeline(
    @Query("period") period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    @Query("limit") limit?: number,
  ): Promise<EnquiriesTimelineDto[]> {
    return this.analyticsService.getEnquiriesTimeline(period, limit);
  }

  @Get("dashboard-summary")
  @ApiOperation({
    summary: "Get dashboard summary",
    description: "Returns key metrics for dashboard overview",
  })
  @ApiOkResponse({
    description: "Dashboard summary metrics",
  })
  async getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }
}
