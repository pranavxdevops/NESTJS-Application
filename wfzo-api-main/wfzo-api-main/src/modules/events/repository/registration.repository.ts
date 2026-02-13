import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { BaseRepository } from "../../../shared/common/base.repository";
import { Registration, RegistrationDocument } from "../schemas/registration.schema";
import { PageQuery, PagedResult } from "../../../shared/common/pagination";

@Injectable()
export class RegistrationRepository extends BaseRepository<Registration> {
  constructor(
    @InjectModel(Registration.name)
    private readonly registrationModel: Model<RegistrationDocument>,
  ) {
    super(registrationModel as unknown as Model<Registration>);
  }

  async findByEventCode(eventCode: string, page: PageQuery): Promise<PagedResult<Registration>> {
    const filter: FilterQuery<Registration> = { eventCode } as FilterQuery<Registration>;
    return this.findAll(filter, page);
  }

  async findByEventCodeAndMembership(
    eventCode: string,
    membershipId: string,
  ): Promise<Registration[]> {
    const filter: FilterQuery<Registration> = {
      eventCode,
      membershipId,
      status: { $ne: "cancelled" },
    } as FilterQuery<Registration>;
    const results = await this.registrationModel.find(filter).lean().exec();
    return results as Registration[];
  }

  async findByEventCodeAndEmail(eventCode: string, email: string): Promise<Registration | null> {
    const filter: FilterQuery<Registration> = {
      eventCode,
      "attendee.email": email,
    } as FilterQuery<Registration>;
    return this.findOne(filter);
  }

  async countByEventCodeAndStatus(eventCode: string, status: string): Promise<number> {
    const filter = {
      eventCode,
      status,
      deletedAt: null,
    } as FilterQuery<Registration>;
    return this.registrationModel.countDocuments(filter).exec();
  }

  async countByEventCode(eventCode: string): Promise<number> {
    const filter = {
      eventCode,
      status: { $ne: "cancelled" },
      deletedAt: null,
    } as FilterQuery<Registration>;
    return this.registrationModel.countDocuments(filter).exec();
  }

  async searchRegistrations(
    eventCode: string,
    filters: {
      status?: string[];
      includeCancelled?: boolean;
      searchQuery?: string;
    },
    page: PageQuery,
  ): Promise<PagedResult<Registration>> {
    const filter: FilterQuery<Registration> = { eventCode } as FilterQuery<Registration>;

    if (filters.status && filters.status.length > 0) {
      (filter as Record<string, unknown>).status = { $in: filters.status };
    } else if (!filters.includeCancelled) {
      (filter as Record<string, unknown>).status = { $ne: "cancelled" };
    }

    if (filters.searchQuery) {
      const searchRegex = { $regex: filters.searchQuery, $options: "i" };
      (filter as Record<string, unknown>).$or = [
        { "attendee.firstName": searchRegex },
        { "attendee.lastName": searchRegex },
        { "attendee.email": searchRegex },
        { "attendee.organization": searchRegex },
      ];
    }

    return this.findAll(filter, page);
  }

  async bulkUpdateStatus(ids: string[], status: string): Promise<boolean> {
    const result = await this.registrationModel
      .updateMany({ id: { $in: ids }, deletedAt: null }, { $set: { status } })
      .exec();
    return result.modifiedCount > 0;
  }
}
