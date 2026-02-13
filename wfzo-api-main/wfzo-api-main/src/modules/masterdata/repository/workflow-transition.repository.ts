import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { BaseRepository } from "@shared/common/base.repository";
import {
  WorkflowTransition,
  WorkflowTransitionDocument,
  WorkflowType,
} from "../schemas/workflow-transition.schema";

/**
 * Repository for WorkflowTransition operations
 */
@Injectable()
export class WorkflowTransitionRepository extends BaseRepository<WorkflowTransitionDocument> {
  constructor(
    @InjectModel(WorkflowTransition.name)
    private workflowTransitionModel: Model<WorkflowTransitionDocument>,
  ) {
    super(workflowTransitionModel);
  }

  /**
   * Get transition by workflow type and current status
   */
  async getTransition(
    workflowType: WorkflowType,
    currentStatus: string,
  ): Promise<WorkflowTransition | null> {
    return this.workflowTransitionModel
      .findOne({
        workflowType,
        currentStatus,
        isActive: true,
        deletedAt: null,
      })
      .lean()
      .exec();
  }

  /**
   * Get all transitions for a workflow type (sorted by order)
   */
  async getWorkflowTransitions(workflowType: WorkflowType): Promise<WorkflowTransition[]> {
    return this.workflowTransitionModel
      .find({
        workflowType,
        isActive: true,
        deletedAt: null,
      })
      .sort({ order: 1 })
      .lean()
      .exec();
  }

  /**
   * Get transition by workflow type and order
   */
  async getTransitionByOrder(
    workflowType: WorkflowType,
    order: number,
  ): Promise<WorkflowTransition | null> {
    return this.workflowTransitionModel
      .findOne({
        workflowType,
        order,
        isActive: true,
        deletedAt: null,
      })
      .lean()
      .exec();
  }
}
