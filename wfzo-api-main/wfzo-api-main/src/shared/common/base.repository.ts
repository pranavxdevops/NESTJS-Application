import { FilterQuery, Model, QueryOptions, UpdateQuery } from "mongoose";
import { PagedResult, PageQuery } from "./pagination";

export class BaseRepository<T extends { deletedAt?: Date | null }> {
  constructor(protected readonly model: Model<T>) {}

  async create(doc: Partial<T>): Promise<T> {
    const created = await this.model.create(doc as any);
    return created.toObject() as T;
  }

  async findById(id: string): Promise<T | null> {
    const filter = { _id: id, deletedAt: null } as unknown as FilterQuery<T>;
    const res = await this.model.findOne(filter).lean<T>().exec();
    return res as T | null;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    const merged = { ...filter, deletedAt: null } as FilterQuery<T>;
    const res = await this.model.findOne(merged).lean<T>().exec();
    return res as T | null;
  }

  async findAll(filter: FilterQuery<T>, page: PageQuery): Promise<PagedResult<T>> {
    const q = { ...filter, deletedAt: null } as FilterQuery<T>;
    const pageNum = Math.max(1, page.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, page.pageSize ?? 20));
    const sort = page.sort ?? "-createdAt";

    const [itemsRaw, total] = await Promise.all([
      this.model
        .find(q)
        .sort(sort)
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean<T>()
        .exec(),
      this.model.countDocuments(q).exec(),
    ]);
    const items = itemsRaw as T[];
    return { items, page: { total, page: pageNum, pageSize } };
  }

  async findMany(filter: FilterQuery<T>): Promise<T[]> {
    const q = { ...filter, deletedAt: null } as FilterQuery<T>;
    const docs = await this.model.find(q).limit(0).lean<T[]>().exec();
    return docs;
  }

  async updateById(id: string, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
    const filter = { _id: id, deletedAt: null } as unknown as FilterQuery<T>;
    return this.model
      .findOneAndUpdate(filter, update, { new: true, ...options })
      .lean<T>()
      .exec();
  }

  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions,
  ): Promise<T | null> {
    const merged = { ...filter, deletedAt: null } as FilterQuery<T>;
    return this.model
      .findOneAndUpdate(merged, update, { new: true, ...options })
      .lean<T>()
      .exec();
  }

  async deleteById(id: string, soft = true): Promise<boolean> {
    if (soft) {
      const filter = { _id: id, deletedAt: null } as unknown as FilterQuery<T>;
      const updateDoc = {
        $set: { deletedAt: new Date() },
      } as unknown as UpdateQuery<T>;
      const res = await this.model.updateOne(filter, updateDoc).exec();
      return res.modifiedCount > 0;
    }
    const filter = { _id: id } as unknown as FilterQuery<T>;
    const res = await this.model.deleteOne(filter).exec();
    return res.deletedCount === 1;
  }

  async deleteOne(filter: FilterQuery<T>, soft = true): Promise<boolean> {
    if (soft) {
      const merged = { ...filter, deletedAt: null } as FilterQuery<T>;
      const updateDoc = {
        $set: { deletedAt: new Date() },
      } as unknown as UpdateQuery<T>;
      const res = await this.model.updateOne(merged, updateDoc).exec();
      return res.modifiedCount > 0;
    }
    const res = await this.model.deleteOne(filter).exec();
    return res.deletedCount === 1;
  }
}
