import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseRepository } from "@shared/common/base.repository";
import { Enquiry } from "../schemas/enquiry.schema";

@Injectable()
export class EnquiriesRepository extends BaseRepository<Enquiry> {
  constructor(@InjectModel(Enquiry.name) model: Model<Enquiry>) {
    super(model);
  }

  async update(id: string, updateData: Partial<Enquiry>): Promise<Enquiry> {
    const updated = await this.model.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) {
      throw new Error(`Enquiry with ID ${id} not found`);
    }
    return updated;
  }
}
