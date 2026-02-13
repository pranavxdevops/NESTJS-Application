import { Test, TestingModule } from "@nestjs/testing";
import { MemberService } from "./member.service";
import { MemberRepository } from "./repository/member.repository";
import { UserService } from "@modules/user/user.service";
import { WorkflowOrchestrator } from "./workflow/services/workflow-orchestrator.service";
import { NotFoundException } from "@nestjs/common";

describe("MemberService", () => {
  let service: MemberService;
  let mockRepository: any;
  let mockUserService: any;
  let mockOrchestrator: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    mockUserService = {
      create: jest.fn(),
      update: jest.fn(),
      findByEmail: jest.fn(),
    };

    mockOrchestrator = {
      executePhase1: jest.fn(),
      executePhase2: jest.fn(),
      executePhase3: jest.fn(),
      executeApproval: jest.fn(),
      executeRejection: jest.fn(),
      addPaymentLink: jest.fn(),
      completePayment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberService,
        { provide: MemberRepository, useValue: mockRepository },
        { provide: UserService, useValue: mockUserService },
        { provide: WorkflowOrchestrator, useValue: mockOrchestrator },
      ],
    }).compile();

    service = module.get<MemberService>(MemberService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should delegate to WorkflowOrchestrator phase 1", async () => {
      const dto = { category: "votingMember", organisationInfo: { companyName: "Test" } };
      const mockMember = { memberId: "MEMBER-001", ...dto };
      mockOrchestrator.executePhase1.mockResolvedValue({ success: true, member: mockMember });

      const result = await service.create(dto as any);

      expect(mockOrchestrator.executePhase1).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockMember);
    });

    it("should throw error when workflow fails", async () => {
      const dto = { category: "votingMember" };
      mockOrchestrator.executePhase1.mockResolvedValue({ success: false, error: "Failed" });

      await expect(service.create(dto as any)).rejects.toThrow("Failed");
    });
  });

  describe("findOne", () => {
    it("should find member by memberId", async () => {
      const mockMember = { memberId: "MEMBER-001" };
      mockRepository.findOne.mockResolvedValue(mockMember);

      const result = await service.findOne("MEMBER-001");

      expect(mockRepository.findOne).toHaveBeenCalledWith({ memberId: "MEMBER-001" });
      expect(result).toEqual(mockMember);
    });

    it("should throw NotFoundException when member not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("MEMBER-999")).rejects.toThrow(NotFoundException);
    });
  });

  describe("search", () => {
    it("should search with query", async () => {
      const query = { q: "Test", page: 1, pageSize: 10 };
      const mockResults = { items: [], total: 0, page: 1, pageSize: 10 };
      mockRepository.findAll.mockResolvedValue(mockResults);

      const result = await service.search(query);

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });
  });

  describe("update", () => {
    it("should route to phase2 by default", async () => {
      const dto = { organisationInfo: { companyName: "Updated" } };
      const mockMember = { memberId: "MEMBER-001" };
      mockOrchestrator.executePhase2.mockResolvedValue({ success: true, member: mockMember });

      const result = await service.update("MEMBER-001", dto);

      expect(mockOrchestrator.executePhase2).toHaveBeenCalledWith("MEMBER-001", dto);
      expect(result).toEqual(mockMember);
    });

    it("should route to phase2 when phase is phase2", async () => {
      const dto = { phase: "phase2", organisationInfo: { companyName: "Updated" } };
      const mockMember = { memberId: "MEMBER-001" };
      mockOrchestrator.executePhase2.mockResolvedValue({ success: true, member: mockMember });

      const result = await service.update("MEMBER-001", dto);

      expect(mockOrchestrator.executePhase2).toHaveBeenCalledWith("MEMBER-001", dto);
      expect(result).toEqual(mockMember);
    });

    it("should route to phase3 when phase is phase3", async () => {
      const dto = { phase: "phase3", memberUsers: [] };
      const mockMember = { memberId: "MEMBER-001", status: "active" };
      mockOrchestrator.executePhase3.mockResolvedValue({ success: true, member: mockMember });

      const result = await service.update("MEMBER-001", dto);

      expect(mockOrchestrator.executePhase3).toHaveBeenCalledWith("MEMBER-001", dto);
      expect(result).toEqual(mockMember);
    });

    it("should throw error for invalid phase", async () => {
      const dto = { phase: "invalid" };

      await expect(service.update("MEMBER-001", dto as any)).rejects.toThrow("Invalid phase");
    });

    it("should throw error when phase2 fails", async () => {
      const dto = { phase: "phase2" };
      mockOrchestrator.executePhase2.mockResolvedValue({ success: false, error: "Update failed" });

      await expect(service.update("MEMBER-001", dto)).rejects.toThrow("Update failed");
    });

    it("should throw error when phase3 fails", async () => {
      const dto = { phase: "phase3" };
      mockOrchestrator.executePhase3.mockResolvedValue({ success: false, error: "Phase3 failed" });

      await expect(service.update("MEMBER-001", dto)).rejects.toThrow("Phase3 failed");
    });
  });

  describe("getIndustries", () => {
    it("should return distinct sorted industries", async () => {
      const members = {
        items: [
          { organisationInfo: { industries: ["Tech", "Finance"] } },
          { organisationInfo: { industries: ["Healthcare", "Tech"] } },
        ],
        total: 2,
      };
      mockRepository.findAll.mockResolvedValue(members);

      const result = await service.getIndustries();

      expect(result).toEqual(["Finance", "Healthcare", "Tech"]);
    });

    it("should filter out null/undefined industries", async () => {
      const members = {
        items: [{ organisationInfo: { industries: ["Tech", null, undefined, "Finance"] } }],
        total: 1,
      };
      mockRepository.findAll.mockResolvedValue(members);

      const result = await service.getIndustries();

      expect(result).toEqual(["Finance", "Tech"]);
    });
  });

  describe("logActivity", () => {
    it("should increment usage count", () => {
      const body = { memberId: "MEMBER-001", featureKey: "download", usageCount: 5 };
      const result = service.logActivity(body);
      expect(result.usageCount).toBe(6);
    });

    it("should set usage count to 1 when not provided", () => {
      const body = { memberId: "MEMBER-001", featureKey: "view" };
      const result = service.logActivity(body);
      expect(result.usageCount).toBe(1);
    });
  });
});
