import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { MembershipController } from "./membership.controller";
import { MembershipService } from "./membership.service";
import { MembershipFeatures } from "./dto/membership.dto";
import { CreateMembershipDto } from "./dto/create-membership.dto";

describe("MembershipController", () => {
  let controller: MembershipController;

  const mockFeatures: MembershipFeatures = {
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
    },
    generatedAt: "2025-10-18T10:30:00Z",
  };

  const mockService = {
    getFeatures: jest.fn(),
    createOrUpdateFeatures: jest.fn(),
    deleteFeatures: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipController],
      providers: [
        {
          provide: MembershipService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MembershipController>(MembershipController);

    jest.clearAllMocks();
  });

  describe("getFeatures", () => {
    it("should return membership features", async () => {
      mockService.getFeatures.mockResolvedValue(mockFeatures);

      const result = await controller.getFeatures("premium");

      expect(result).toEqual(mockFeatures);
      expect(mockService.getFeatures).toHaveBeenCalledWith("premium");
    });

    it("should throw NotFoundException when membership not found", async () => {
      mockService.getFeatures.mockRejectedValue(
        new NotFoundException("Membership type 'nonexistent' not found"),
      );

      await expect(controller.getFeatures("nonexistent")).rejects.toThrow(NotFoundException);
    });
  });

  describe("createOrUpdateFeatures", () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const createDto: CreateMembershipDto = {
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

    it("should create or update membership features", async () => {
      mockService.createOrUpdateFeatures.mockResolvedValue(mockFeatures);

      const result = await controller.createOrUpdateFeatures("premium", createDto);

      expect(result).toEqual(mockFeatures);
      expect(mockService.createOrUpdateFeatures).toHaveBeenCalledWith("premium", createDto);
    });
  });

  describe("deleteFeatures", () => {
    it("should delete membership features", async () => {
      mockService.deleteFeatures.mockResolvedValue(undefined);

      await controller.deleteFeatures("premium");

      expect(mockService.deleteFeatures).toHaveBeenCalledWith("premium");
    });

    it("should throw NotFoundException when membership not found", async () => {
      mockService.deleteFeatures.mockRejectedValue(
        new NotFoundException("Membership type 'nonexistent' not found"),
      );

      await expect(controller.deleteFeatures("nonexistent")).rejects.toThrow(NotFoundException);
    });
  });
});
