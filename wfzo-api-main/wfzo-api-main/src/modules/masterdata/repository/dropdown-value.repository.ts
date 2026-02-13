import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DropdownValue, type DropdownValueDocument } from "../schemas/dropdown-value.schema";
import { BaseRepository } from "../../../shared/common/base.repository";

@Injectable()
export class DropdownValueRepository extends BaseRepository<DropdownValueDocument> {
  constructor(
    @InjectModel(DropdownValue.name) private dropdownValueModel: Model<DropdownValueDocument>,
  ) {
    super(dropdownValueModel);
  }

  /**
   * Find all dropdown values by category
   */
  async findByCategory(category: string): Promise<DropdownValueDocument[]> {
    return this.dropdownValueModel.find({ category }).sort({ displayOrder: 1 }).exec();
  }

  /**
   * Find dropdown value by category and code
   */
  async findByCategoryAndCode(
    category: string,
    code: string,
  ): Promise<DropdownValueDocument | null> {
    return this.dropdownValueModel.findOne({ category, code }).exec();
  }

  /**
   * Find dropdown values by multiple categories
   */
  async findByCategories(categories: string[]): Promise<DropdownValueDocument[]> {
    return this.dropdownValueModel
      .find({ category: { $in: categories }, isActive: true })
      .sort({ category: 1, displayOrder: 1 })
      .exec();
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    return this.dropdownValueModel.distinct("category").exec();
  }
}
