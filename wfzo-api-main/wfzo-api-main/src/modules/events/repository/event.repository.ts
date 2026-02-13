import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";
import { BaseRepository } from "../../../shared/common/base.repository";
import { Event, EventDocument } from "../schemas/event.schema";
import { PageQuery, PagedResult } from "../../../shared/common/pagination";

@Injectable()
export class EventRepository extends BaseRepository<Event> {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {
    super(eventModel as unknown as Model<Event>);
  }

  async findByEventCode(eventCode: string): Promise<Event | null> {
    return this.findOne({ eventCode } as FilterQuery<Event>);
  }

  async findByStatus(status: string[], page: PageQuery): Promise<PagedResult<Event>> {
    const filter: FilterQuery<Event> = { status: { $in: status } } as FilterQuery<Event>;
    return this.findAll(filter, page);
  }

  async findByCreator(memberId: string, page: PageQuery): Promise<PagedResult<Event>> {
    const filter: FilterQuery<Event> = {
      "createdBy.memberId": memberId,
    } as FilterQuery<Event>;
    return this.findAll(filter, page);
  }

  async findByType(type: string, page: PageQuery): Promise<PagedResult<Event>> {
    const filter: FilterQuery<Event> = { type } as FilterQuery<Event>;
    return this.findAll(filter, page);
  }

  async searchEvents(
    searchQuery: string,
    filters: {
      status?: string[];
      type?: string;
      createdBy?: string;
    },
    page: PageQuery,
  ): Promise<PagedResult<Event>> {
    const filter: FilterQuery<Event> = {} as FilterQuery<Event>;

    if (searchQuery) {
      (filter as Record<string, unknown>).$text = { $search: searchQuery };
    }

    if (filters.status && filters.status.length > 0) {
      (filter as Record<string, unknown>).status = { $in: filters.status };
    }

    if (filters.type) {
      (filter as Record<string, unknown>).type = filters.type;
    }

    if (filters.createdBy) {
      (filter as Record<string, unknown>)["createdBy.memberId"] = filters.createdBy;
    }

    return this.findAll(filter, page);
  }

  async countByEventCode(eventCode: string): Promise<number> {
    const filter = { eventCode, deletedAt: null } as FilterQuery<Event>;
    return this.eventModel.countDocuments(filter).exec();
  }

  async updateEventStatus(eventCode: string, status: string): Promise<Event | null> {
    const filter = { eventCode, deletedAt: null } as FilterQuery<Event>;
    return this.eventModel
      .findOneAndUpdate(filter, { $set: { status } }, { new: true })
      .lean<Event>()
      .exec();
  }
}
