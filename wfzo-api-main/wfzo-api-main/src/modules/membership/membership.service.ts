import { Injectable, NotFoundException } from "@nestjs/common";
import { FilterQuery } from "mongoose";
import { MembershipRepository } from "./repository/membership.repository";
import { Membership } from "./schemas/membership.schema";
import type { MembershipFeatures, EntitlementsMap } from "./dto/membership.dto";
import { CreateMembershipDto } from "./dto/create-membership.dto";

@Injectable()
export class MembershipService {
  constructor(private readonly repo: MembershipRepository) {}

  async getFeatures(type: string): Promise<MembershipFeatures> {
    const filter: FilterQuery<Membership> = { type };
    const membership = await this.repo.findOne(filter);

    if (!membership) {
      throw new NotFoundException(`Membership type '${type}' not found`);
    }

    return {
      type: membership.type,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      entitlements: membership.entitlements as any,
      generatedAt: new Date().toISOString(),
    };
  }

  async createOrUpdateFeatures(
    type: string,
    dto: CreateMembershipDto,
  ): Promise<MembershipFeatures> {
    const filter: FilterQuery<Membership> = { type };
    const existing = await this.repo.findOne(filter);

    let membership: Membership;

    if (existing) {
      // Update existing
      membership = (await this.repo.updateOne(
        filter,
        {
          $set: {
            entitlements: dto.entitlements as any,
            description: dto.description,
          },
        },
        { new: true },
      )) as Membership;
    } else {
      // Create new - the create method returns the saved document
      membership = await this.repo.create({
        type: dto.type,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        entitlements: dto.entitlements as any,
        description: dto.description,
        deletedAt: null,
      });
    }

    return {
      type: membership.type,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      entitlements: membership.entitlements as any,
      generatedAt: new Date().toISOString(),
    };
  }

  async deleteFeatures(type: string): Promise<void> {
    const filter: FilterQuery<Membership> = { type };
    const deleted = await this.repo.deleteOne(filter, true);

    if (!deleted) {
      throw new NotFoundException(`Membership type '${type}' not found`);
    }
  }
}
