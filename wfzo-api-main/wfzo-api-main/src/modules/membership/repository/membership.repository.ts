import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseRepository } from "@shared/common/base.repository";
import { Membership } from "../schemas/membership.schema";

@Injectable()
export class MembershipRepository extends BaseRepository<Membership> {
  constructor(@InjectModel(Membership.name) model: Model<Membership>) {
    super(model);
  }

  async create(doc: Partial<Membership>): Promise<Membership> {
    // Use model.create() which handles Schema.Types.Mixed properly
    const created = await this.model.create({
      type: doc.type,
      description: doc.description,
      deletedAt: doc.deletedAt ?? null,
      entitlements: doc.entitlements,
    });
    return created.toObject() as Membership;
  }
}
