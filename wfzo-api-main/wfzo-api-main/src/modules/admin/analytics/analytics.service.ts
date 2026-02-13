import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Member } from "@modules/member/schemas/member.schema";
import { Enquiry } from "@modules/enquiries/schemas/enquiry.schema";
import {
  MembersByContinentDto,
  MembershipRequestsTimelineDto,
  MemberGrowthDto,
  EnquiriesTimelineDto,
} from "./dto/analytics.dto";
import * as countries from "country-data";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<Member>,
    @InjectModel(Enquiry.name) private enquiryModel: Model<Enquiry>,
  ) {}

  // Map country to continent
  private getContinent(countryCode: string): string {
    const continentMap: Record<string, string> = {
      // Asia
      AF: "Asia", AM: "Asia", AZ: "Asia", BH: "Asia", BD: "Asia", BT: "Asia",
      BN: "Asia", KH: "Asia", CN: "Asia", CY: "Asia", GE: "Asia", IN: "Asia",
      ID: "Asia", IR: "Asia", IQ: "Asia", IL: "Asia", JP: "Asia", JO: "Asia",
      KZ: "Asia", KW: "Asia", KG: "Asia", LA: "Asia", LB: "Asia", MY: "Asia",
      MV: "Asia", MN: "Asia", MM: "Asia", NP: "Asia", KP: "Asia", OM: "Asia",
      PK: "Asia", PS: "Asia", PH: "Asia", QA: "Asia", SA: "Asia", SG: "Asia",
      KR: "Asia", LK: "Asia", SY: "Asia", TW: "Asia", TJ: "Asia", TH: "Asia",
      TL: "Asia", TR: "Asia", TM: "Asia", AE: "Asia", UZ: "Asia", VN: "Asia",
      YE: "Asia",

      // Europe
      AL: "Europe", AD: "Europe", AT: "Europe", BY: "Europe", BE: "Europe",
      BA: "Europe", BG: "Europe", HR: "Europe", CZ: "Europe", DK: "Europe",
      EE: "Europe", FI: "Europe", FR: "Europe", DE: "Europe", GR: "Europe",
      HU: "Europe", IS: "Europe", IE: "Europe", IT: "Europe", XK: "Europe",
      LV: "Europe", LI: "Europe", LT: "Europe", LU: "Europe", MK: "Europe",
      MT: "Europe", MD: "Europe", MC: "Europe", ME: "Europe", NL: "Europe",
      NO: "Europe", PL: "Europe", PT: "Europe", RO: "Europe", RU: "Europe",
      SM: "Europe", RS: "Europe", SK: "Europe", SI: "Europe", ES: "Europe",
      SE: "Europe", CH: "Europe", UA: "Europe", GB: "Europe", VA: "Europe",

      // Africa
      DZ: "Africa", AO: "Africa", BJ: "Africa", BW: "Africa", BF: "Africa",
      BI: "Africa", CM: "Africa", CV: "Africa", CF: "Africa", TD: "Africa",
      KM: "Africa", CG: "Africa", CD: "Africa", CI: "Africa", DJ: "Africa",
      EG: "Africa", GQ: "Africa", ER: "Africa", ET: "Africa", GA: "Africa",
      GM: "Africa", GH: "Africa", GN: "Africa", GW: "Africa", KE: "Africa",
      LS: "Africa", LR: "Africa", LY: "Africa", MG: "Africa", MW: "Africa",
      ML: "Africa", MR: "Africa", MU: "Africa", MA: "Africa", MZ: "Africa",
      NA: "Africa", NE: "Africa", NG: "Africa", RW: "Africa", ST: "Africa",
      SN: "Africa", SC: "Africa", SL: "Africa", SO: "Africa", ZA: "Africa",
      SS: "Africa", SD: "Africa", SZ: "Africa", TZ: "Africa", TG: "Africa",
      TN: "Africa", UG: "Africa", ZM: "Africa", ZW: "Africa",

      // North America
      AG: "North America", BS: "North America", BB: "North America",
      BZ: "North America", CA: "North America", CR: "North America",
      CU: "North America", DM: "North America", DO: "North America",
      SV: "North America", GD: "North America", GT: "North America",
      HT: "North America", HN: "North America", JM: "North America",
      MX: "North America", NI: "North America", PA: "North America",
      KN: "North America", LC: "North America", VC: "North America",
      TT: "North America", US: "North America",

      // South America
      AR: "South America", BO: "South America", BR: "South America",
      CL: "South America", CO: "South America", EC: "South America",
      GY: "South America", PY: "South America", PE: "South America",
      SR: "South America", UY: "South America", VE: "South America",

      // Oceania
      AU: "Oceania", FJ: "Oceania", KI: "Oceania", MH: "Oceania",
      FM: "Oceania", NR: "Oceania", NZ: "Oceania", PW: "Oceania",
      PG: "Oceania", WS: "Oceania", SB: "Oceania", TO: "Oceania",
      TV: "Oceania", VU: "Oceania",

      // Antarctica
      AQ: "Antarctica",
    };

    return continentMap[countryCode] || "Other";
  }

  async getMembersByContinent(): Promise<MembersByContinentDto[]> {
    const members = await this.memberModel.find({
      deletedAt: null,
      status: { $in: ["approved", "active"] },
    }).select("organisationInfo.address.countryCode");

    const continentCounts: Record<string, number> = {};
    let total = 0;

    members.forEach((member) => {
      const countryCode = member.organisationInfo?.address?.countryCode;
      if (countryCode) {
        const continent = this.getContinent(countryCode);
        continentCounts[continent] = (continentCounts[continent] || 0) + 1;
        total++;
      }
    });

    return Object.entries(continentCounts)
      .map(([continent, count]) => ({
        continent,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getMembershipRequestsTimeline(
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    limit?: number,
  ): Promise<MembershipRequestsTimelineDto[]> {
    const defaultLimits = { daily: 30, weekly: 12, monthly: 12, yearly: 12 };
    const resultLimit = limit || defaultLimits[period];

    let groupFormat: string;
    let sortFormat: string;

    switch (period) {
      case "daily":
        groupFormat = "%Y-%m-%d";
        sortFormat = "%Y-%m-%d";
        break;
      case "weekly":
        groupFormat = "%Y-W%V";
        sortFormat = "%Y-W%V";
        break;
      case "yearly":
        groupFormat = "%Y";
        sortFormat = "%Y";
        break;
      case "monthly":
      default:
        groupFormat = "%Y-%m";
        sortFormat = "%Y-%m";
        break;
    }

    const results = await this.memberModel.aggregate([
      {
        $match: {
          deletedAt: null,
          createdAt: { $exists: true },
        },
      },
      {
        $addFields: {
          // Use approvalDate if exists, otherwise fall back to approvalLetterDate, then createdAt
          effectiveApprovalDate: {
            $ifNull: [
              "$approvalDate",
              { $ifNull: ["$approvalLetterDate", "$createdAt"] },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$effectiveApprovalDate" },
          },
          count: { $sum: 1 },
          approved: {
            $sum: {
              $cond: [
                { $in: ["$status", ["approved", "active", "approvedPendingPayment"]] },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    [
                      "pendingFormSubmission",
                      "pendingCommitteeApproval",
                      "pendingBoardApproval",
                      "pendingCEOApproval",
                    ],
                  ],
                },
                1,
                0,
              ],
            },
          },
          rejected: {
            $sum: {
              $cond: [
                { $eq: ["$status", "rejected"] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: resultLimit },
    ]);

    return results
      .reverse()
      .map((r) => ({
        period: r._id,
        count: r.count,
        approved: r.approved,
        pending: r.pending,
        rejected: r.rejected,
      }));
  }

  async getMemberGrowth(
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    limit?: number,
  ): Promise<MemberGrowthDto[]> {
    const defaultLimits = { daily: 30, weekly: 12, monthly: 12, yearly: 12 };
    const resultLimit = limit || defaultLimits[period];

    let groupFormat: string;

    switch (period) {
      case "daily":
        groupFormat = "%Y-%m-%d";
        break;
      case "weekly":
        groupFormat = "%Y-W%V";
        break;
      case "yearly":
        groupFormat = "%Y";
        break;
      case "monthly":
      default:
        groupFormat = "%Y-%m";
        break;
    }

    const results = await this.memberModel.aggregate([
      {
        $match: {
          deletedAt: null,
          status: { $in: ["approved", "active"] },
        },
      },
      {
        $addFields: {
          // Use approvalLetterDate if exists, otherwise approvalDate, otherwise createdAt
          effectiveApprovalDate: {
            $ifNull: [
              "$approvalLetterDate",
              { $ifNull: ["$approvalDate", "$createdAt"] },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$effectiveApprovalDate" },
          },
          newMembers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Calculate cumulative totals
    let cumulative = 0;
    const growthData = results.map((r) => {
      cumulative += r.newMembers;
      return {
        period: r._id,
        totalMembers: cumulative,
        newMembers: r.newMembers,
      };
    });

    // Return last N periods
    return growthData.slice(-resultLimit);
  }

  async getEnquiriesTimeline(
    period: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    limit?: number,
  ): Promise<EnquiriesTimelineDto[]> {
    const defaultLimits = { daily: 30, weekly: 12, monthly: 12, yearly: 12 };
    const resultLimit = limit || defaultLimits[period];

    let groupFormat: string;

    switch (period) {
      case "daily":
        groupFormat = "%Y-%m-%d";
        break;
      case "weekly":
        groupFormat = "%Y-W%V";
        break;
      case "yearly":
        groupFormat = "%Y";
        break;
      case "monthly":
      default:
        groupFormat = "%Y-%m";
        break;
    }

    const results = await this.enquiryModel.aggregate([
      {
        $match: {
          deletedAt: null,
          createdAt: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: "$createdAt" },
          },
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$enquiryStatus", "pending"] }, 1, 0],
            },
          },
          approved: {
            $sum: {
              $cond: [{ $eq: ["$enquiryStatus", "approved"] }, 1, 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$enquiryStatus", "rejected"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: resultLimit },
    ]);

    return results.reverse().map((r) => ({
      period: r._id,
      total: r.total,
      pending: r.pending,
      approved: r.approved,
      rejected: r.rejected,
    }));
  }

  async getDashboardSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Total members
    const totalMembers = await this.memberModel.countDocuments({
      deletedAt: null,
      status: { $in: ["approved", "active"] },
    });

    // New members this month
    const newMembersThisMonth = await this.memberModel.countDocuments({
      deletedAt: null,
      status: { $in: ["approved", "active"] },
      createdAt: { $gte: startOfMonth },
    });

    // New members last month
    const newMembersLastMonth = await this.memberModel.countDocuments({
      deletedAt: null,
      status: { $in: ["approved", "active"] },
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
    });

    // Pending approvals
    const pendingApprovals = await this.memberModel.countDocuments({
      deletedAt: null,
      status: {
        $in: [
          "pendingCommitteeApproval",
          "pendingBoardApproval",
          "pendingCEOApproval",
        ],
      },
    });

    // Total enquiries
    const totalEnquiries = await this.enquiryModel.countDocuments({
      deletedAt: null,
    });

    // Pending enquiries
    const pendingEnquiries = await this.enquiryModel.countDocuments({
      deletedAt: null,
      enquiryStatus: "pending",
    });

    // Calculate growth percentage
    const growthPercentage =
      newMembersLastMonth > 0
        ? Math.round(
            ((newMembersThisMonth - newMembersLastMonth) / newMembersLastMonth) * 100,
          )
        : 0;

    return {
      totalMembers,
      newMembersThisMonth,
      growthPercentage,
      pendingApprovals,
      totalEnquiries,
      pendingEnquiries,
    };
  }
}
