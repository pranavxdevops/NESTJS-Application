import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseRepository } from "@shared/common/base.repository";
import { Member } from "../schemas/member.schema";

@Injectable()
export class MemberRepository extends BaseRepository<Member> {
  constructor(@InjectModel(Member.name) model: Model<Member>) {
    super(model);
  }
}
