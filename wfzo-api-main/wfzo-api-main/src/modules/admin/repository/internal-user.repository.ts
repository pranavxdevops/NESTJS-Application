import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseRepository } from "@shared/common/base.repository";
import { InternalUser } from "../schemas/internal-user.schema";

export class InternalUserRepository extends BaseRepository<InternalUser> {
  constructor(@InjectModel(InternalUser.name) model: Model<InternalUser>) {
    super(model);
  }
}
