import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseRepository } from "@shared/common/base.repository";
import { Request } from "../schemas/request.schema";

@Injectable()
export class RequestsRepository extends BaseRepository<Request> {
  constructor(@InjectModel(Request.name) model: Model<Request>) {
    super(model);
  }

  /**
   * Custom method to update request by ID
   * Ensures proper lean execution and typing
   */
  async updateById(id: string, updateData: Partial<Request>): Promise<Request | null> {
    const updated = await this.model
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean<Request>()
      .exec();
    return updated as Request | null;
  }

  /**
   * Find all requests for a specific member
   */
  async findByMemberId(memberId: string, page: number = 1, pageSize: number = 20) {
    const filter = { memberId, deletedAt: null };
    return this.findAll(filter as any, { page, pageSize });
  }

  /**
   * Find all requests by status
   */
  async findByStatus(status: string, page: number = 1, pageSize: number = 20) {
    const filter = { requestStatus: status, deletedAt: null };
    return this.findAll(filter as any, { page, pageSize });
  }
}
