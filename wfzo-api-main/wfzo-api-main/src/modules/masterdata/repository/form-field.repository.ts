import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { FormField, type FormFieldDocument } from "../schemas/form-field.schema";
import { BaseRepository } from "../../../shared/common/base.repository";

@Injectable()
export class FormFieldRepository extends BaseRepository<FormFieldDocument> {
  constructor(@InjectModel(FormField.name) private formFieldModel: Model<FormFieldDocument>) {
    super(formFieldModel);
  }

  /**
   * Find form field by field key
   */
  async findByFieldKey(fieldKey: string): Promise<FormFieldDocument | null> {
    return this.formFieldModel.findOne({ fieldKey, isActive: true }).exec();
  }

  /**
   * Find all active form fields by keys
   */
  async findByFieldKeys(fieldKeys: string[]): Promise<FormFieldDocument[]> {
    return this.formFieldModel
      .find({ fieldKey: { $in: fieldKeys }, isActive: true })
      .sort({ displayOrder: 1 })
      .exec();
  }

  /**
   * Find all form fields by type
   */
  async findByFieldType(fieldType: string): Promise<FormFieldDocument[]> {
    return this.formFieldModel.find({ fieldType, isActive: true }).sort({ displayOrder: 1 }).exec();
  }

  /**
   * Find all active form fields (non-paginated)
   */
  async findAllFields(): Promise<FormFieldDocument[]> {
    return this.formFieldModel.find({ isActive: true }).sort({ displayOrder: 1 }).exec();
  }

  /**
   * Find all form fields by page
   * @param page - Page identifier (e.g., "member-registration-phase1")
   * @returns Array of form field documents for the specified page
   */
  async findByPage(page: string): Promise<FormFieldDocument[]> {
    return this.formFieldModel.find({ page, deletedAt: null }).sort({ displayOrder: 1 }).exec();
  }
}
