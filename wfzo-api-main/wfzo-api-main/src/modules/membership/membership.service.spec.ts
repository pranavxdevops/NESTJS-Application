import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { MembershipService } from "./membership.service";
import { MembershipRepository } from "./repository/membership.repository";
import { Membership } from "./schemas/membership.schema";

describe("MembershipService", () => {
  let service: MembershipService;

  const mockMembership: Membership = {
    type: "premium",
    entitlements: {
      "events.seats": {
        access: "restricted",
        quota: {
          kind: "seats",
          limit: 100,
          used: 0,
          remaining: 100,
          window: "per-event",
          resetsAt: null,
        },
      },
      "library.downloads": {
        access: "restricted",
        quota: {
          kind: "downloads",
          limit: 500,
          used: 0,
          remaining: 500,
          window: "monthly",
          resetsAt: null,
        },
      },
    },
    description: "Premium membership",
    deletedAt: null,
  };

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MembershipService,
        {
          provide: MembershipRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get(MembershipService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("getFeatures", () => {
    it("should return membership features for existing type", async () => {
      mockRepo.findOne.mockResolvedValue(mockMembership);

      const result = await service.getFeatures("premium");

      expect(result.type).toBe("premium");
      expect(result.entitlements).toBeDefined();
      expect(Object.keys(result.entitlements).length).toBe(2);
      expect(result.entitlements["events.seats"]).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(mockRepo.findOne).toHaveBeenCalledWith({ type: "premium" });
    });

    it("should throw NotFoundException when membership type not found", async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.getFeatures("nonexistent")).rejects.toThrow(NotFoundException);
      await expect(service.getFeatures("nonexistent")).rejects.toThrow(
        "Membership type 'nonexistent' not found",
      );
    });
  });

  describe("createOrUpdateFeatures", () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const createDto = {
      type: "premium",
      entitlements: {
        "events.seats": {
          access: "restricted",
          quota: {
            kind: "seats",
            limit: 100,
            used: 0,
            remaining: 100,
            window: "per-event",
          },
        },
      },
      description: "Premium membership",
    } as any;

    it("should create new membership when not exists", async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(mockMembership);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.createOrUpdateFeatures("premium", createDto);

      expect(result.type).toBe("premium");
      expect(result.entitlements).toBeDefined();
      expect(mockRepo.findOne).toHaveBeenCalledWith({ type: "premium" });
      expect(mockRepo.create).toHaveBeenCalledTimes(1);
    });

    it("should update existing membership when exists", async () => {
      mockRepo.findOne.mockResolvedValue(mockMembership);
      mockRepo.updateOne.mockResolvedValue(mockMembership);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.createOrUpdateFeatures("premium", createDto);

      expect(result.type).toBe("premium");
      expect(result.entitlements).toBeDefined();
      expect(mockRepo.findOne).toHaveBeenCalledWith({ type: "premium" });
      expect(mockRepo.updateOne).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteFeatures", () => {
    it("should soft delete membership", async () => {
      mockRepo.deleteOne.mockResolvedValue(true);

      await service.deleteFeatures("premium");

      expect(mockRepo.deleteOne).toHaveBeenCalledWith({ type: "premium" }, true);
    });

    it("should throw NotFoundException when membership not found", async () => {
      mockRepo.deleteOne.mockResolvedValue(false);

      await expect(service.deleteFeatures("nonexistent")).rejects.toThrow(NotFoundException);
      await expect(service.deleteFeatures("nonexistent")).rejects.toThrow(
        "Membership type 'nonexistent' not found",
      );
    });
  });
});
