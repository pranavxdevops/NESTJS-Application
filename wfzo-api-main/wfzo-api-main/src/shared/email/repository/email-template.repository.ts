import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { EmailTemplate } from "../schemas/email-template.schema";
import { BaseRepository } from "../../common/base.repository";

@Injectable()
export class EmailTemplateRepository extends BaseRepository<EmailTemplate> {
  constructor(
    @InjectModel(EmailTemplate.name)
    private readonly emailTemplateModel: Model<EmailTemplate>,
  ) {
    super(emailTemplateModel);
  }

  /**
   * Find template by code
   */
  async findByCode(templateCode: string): Promise<EmailTemplate | null> {
    return this.emailTemplateModel
      .findOne({
        templateCode,
        isActive: true,
        deletedAt: null,
      })
      .exec();
  }

  /**
   * Find all active templates
   */
  async findAllActive(): Promise<EmailTemplate[]> {
    return this.emailTemplateModel
      .find({
        isActive: true,
        deletedAt: null,
      })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Find templates by process/workflow name
   */
  async findByProcess(process: string): Promise<EmailTemplate[]> {
    return this.emailTemplateModel
      .find({
        process,
        isActive: true,
        deletedAt: null,
      })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Update a template by ID
   */
  async updateById(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    return this.emailTemplateModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).exec();
  }
}
