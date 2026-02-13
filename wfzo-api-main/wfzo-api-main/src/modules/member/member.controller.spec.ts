import { Test, TestingModule } from "@nestjs/testing";
import { MemberController } from "./member.controller";
import { MemberService } from "./member.service";

describe("MemberController", () => {
  let controller: MemberController;
  let service: MemberService;

  beforeEach(async () => {
    const mockService = {
      getIndustries: jest.fn(),
      getPartnersAndSponsors: jest.fn(),
      getFeatured: jest.fn(),
      getMapData: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberController],
      providers: [{ provide: MemberService, useValue: mockService }],
    }).compile();

    controller = module.get<MemberController>(MemberController);
    service = module.get<MemberService>(MemberService);
  });

  describe("industries", () => {
    it("should return list of industries", async () => {
      const mockIndustries = ["Technology", "Finance", "Healthcare"];
      jest.spyOn(service, "getIndustries").mockResolvedValue(mockIndustries);

      const result = await controller.industries();

      expect(result).toEqual(mockIndustries);
      expect(service.getIndustries).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no industries", async () => {
      jest.spyOn(service, "getIndustries").mockResolvedValue([]);

      const result = await controller.industries();

      expect(result).toEqual([]);
    });
  });

  describe("partnersAndSponsors", () => {
    it("should return partners and sponsors", async () => {
      const mockData = {
        partners: [
          {
            id: "p-1",
            name: "Partner Corp",
            logoUrl: "http://example.com/logo.png",
            websiteUrl: "http://partnercorp.com",
            industries: ["Technology"],
          },
        ],
        sponsors: [
          {
            id: "s-1",
            name: "Sponsor LLC",
            logoUrl: "http://example.com/sponsor.png",
            websiteUrl: "http://sponsorllc.com",
            industries: ["Finance"],
          },
        ],
      };
      jest.spyOn(service, "getPartnersAndSponsors").mockResolvedValue(mockData);

      const result = await controller.partnersAndSponsors();

      expect(result).toEqual(mockData);
      expect(service.getPartnersAndSponsors).toHaveBeenCalledTimes(1);
    });

    it("should return empty arrays when no partners or sponsors", async () => {
      const mockData = { partners: [], sponsors: [] };
      jest.spyOn(service, "getPartnersAndSponsors").mockResolvedValue(mockData);

      const result = await controller.partnersAndSponsors();

      expect(result.partners).toEqual([]);
      expect(result.sponsors).toEqual([]);
    });
  });

  describe("featured", () => {
    it("should return featured members", async () => {
      const mockFeatured = [
        {
          id: "m-1",
          memberCode: "m-1",
          name: "Featured Corp",
          logoUrl: "http://example.com/logo.png",
          description: "A featured company",
          industries: ["Technology", "Finance"],
        },
        {
          id: "m-2",
          memberCode: "m-2",
          name: "Featured LLC",
          logoUrl: "http://example.com/logo2.png",
          description: "",
          industries: ["Healthcare"],
        },
      ];
      jest.spyOn(service, "getFeatured").mockResolvedValue(mockFeatured);

      const result = await controller.featured();

      expect(result).toEqual(mockFeatured);
      expect(result).toHaveLength(2);
      expect(service.getFeatured).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no featured members", async () => {
      jest.spyOn(service, "getFeatured").mockResolvedValue([]);

      const result = await controller.featured();

      expect(result).toEqual([]);
    });
  });

  describe("mapData", () => {
    it('should return member coordinates when action is "view-member"', async () => {
      const mockData = {
        companyMapData: [
          {
            id: "m-1",
            companyName: "Company A",
            latitude: 40.7128,
            longitude: -74.006,
            country: "United States",
            city: "New York",
            industries: ["Technology"],
          },
          {
            id: "m-2",
            companyName: "Company B",
            latitude: 51.5074,
            longitude: -0.1278,
            country: "United Kingdom",
            city: "London",
            industries: ["Finance"],
          },
        ],
      };
      jest.spyOn(service, "getMapData").mockResolvedValue(mockData);

      const result = await controller.mapData("view-member");

      expect(result).toEqual(mockData);
      expect(service.getMapData).toHaveBeenCalledWith("view-member");
    });

    it('should return aggregate counts when action is "view-map"', async () => {
      const mockData = {
        continentMemberCount: {
          "North America": 3,
          Europe: 2,
          Asia: 1,
        },
        countryMemberCount: [
          { country: "United States", count: 3 },
          { country: "United Kingdom", count: 2 },
          { country: "Japan", count: 1 },
        ],
      };
      jest.spyOn(service, "getMapData").mockResolvedValue(mockData);

      const result = await controller.mapData("view-map");

      expect(result).toEqual(mockData);
      expect(service.getMapData).toHaveBeenCalledWith("view-map");
    });

    it("should call service with any action parameter", async () => {
      const mockData = {
        continentMemberCount: {},
        countryMemberCount: [],
      };
      jest.spyOn(service, "getMapData").mockResolvedValue(mockData);

      await controller.mapData("some-other-action");

      expect(service.getMapData).toHaveBeenCalledWith("some-other-action");
    });
  });

  describe("updateStatus", () => {
    it("should update member status", async () => {
      const mockResponse = { id: "m-1", status: "active" };
      jest.spyOn(service, "updateStatus").mockResolvedValue(mockResponse);

      const result = await controller.updateStatus("m-1", "active");

      expect(result).toEqual(mockResponse);
      expect(service.updateStatus).toHaveBeenCalledWith("m-1", "active");
    });
  });
});
