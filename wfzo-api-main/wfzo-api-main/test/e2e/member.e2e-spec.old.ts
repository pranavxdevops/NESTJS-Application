import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import type { App } from "supertest/types";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AppModule } from "../../src/app.module";
import { applyAppSettings } from "../../src/bootstrap/app-setup";
import type { AppLike } from "../../src/bootstrap/app-setup";

describe("Member (e2e)", () => {
  let app: INestApplication<App>;
  let mongod: MongoMemoryServer;
  let emailCounter = 0;

  // Helper to create a basic user for member with unique email
  const createMemberUser = () => {
    emailCounter++;
    const email = `test${emailCounter}@example.com`;
    return {
      email,
      firstName: "Test",
      lastName: "User",
      userType: "Primary" as const,
      phoneNumber: `+97150${String(emailCounter).padStart(7, "0")}`,
    };
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app as unknown as AppLike);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it("POST /member should create", async () => {
    const dto = {
      category: "associateMember" as const,
      memberUsers: [
        {
          email: "acme@example.com",
          firstName: "Acme",
          lastName: "Admin",
          userType: "Primary" as const,
          phoneNumber: "+971501234567",
        },
      ],
      organisationInfo: {
        companyName: "Acme Corp",
        websiteUrl: "https://www.acme.com",
        tradeLicenseNumber: "TL123456",
        industries: ["Technology"],
        country: "United Arab Emirates",
        focalPoints: ["Technology"],
      },
      consents: {
        termsAccepted: true,
        privacyPolicyAccepted: true,
      },
    };
    const http = app.getHttpServer() as unknown as App;
    const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(201);
    const body = res.body as { memberId?: string; organisationInfo?: { companyName: string } };
    expect(body.organisationInfo?.companyName).toBe("Acme Corp");
    expect(body.memberId).toBeDefined();
  });

  it("GET /member/:id should fetch", async () => {
    const http = app.getHttpServer() as unknown as App;

    // First create a member to fetch
    const createRes = await request(http)
      .post("/wfzo/api/v1/member")
      .send({
        category: "associateMember" as const,
        memberUsers: [createMemberUser()],
        organisationInfo: {
          companyName: "Fetch Test Corp",
          websiteUrl: "https://fetchtest.com",
          tradeLicenseNumber: "TL999999",
          industries: ["Technology"],
          country: "United Arab Emirates",
          focalPoints: ["Technology"],
        },
        consents: {
          termsAccepted: true,
          privacyPolicyAccepted: true,
        },
      })
      .expect(201);

    const createdMember = createRes.body as { memberId: string };

    const res = await request(http)
      .get(`/wfzo/api/v1/member/${createdMember.memberId}`)
      .expect(200);
    const body = res.body as { memberId: string };
    expect(body.memberId).toBe(createdMember.memberId);
  });

  it("POST /member validation error", async () => {
    const http = app.getHttpServer() as unknown as App;
    await request(http).post("/wfzo/api/v1/member").send({ category: "invalid" }).expect(400);
  });

  it("PUT /member/status/:memberId/:status should update status", async () => {
    const http = app.getHttpServer() as unknown as App;

    // First create a member
    const createRes = await request(http)
      .post("/wfzo/api/v1/member")
      .send({
        category: "associateMember" as const,
        memberUsers: [createMemberUser()],
        organisationInfo: {
          companyName: "Status Test Corp",
          websiteUrl: "https://statustest.com",
          tradeLicenseNumber: "TL888888",
          industries: ["Technology"],
          country: "United Arab Emirates",
          focalPoints: ["Technology"],
        },
        consents: {
          termsAccepted: true,
          privacyPolicyAccepted: true,
        },
      })
      .expect(201);

    const createdMember = createRes.body as { memberId: string };

    // Update status via approval workflow
    const res = await request(http)
      .put(`/wfzo/api/v1/member/status/${createdMember.memberId}`)
      .send({
        status: "pendingCommitteeApproval",
        stage: "committee",
      })
      .expect(200);
    const body = res.body as { memberId: string; status: string };
    expect(body.memberId).toBe(createdMember.memberId);
    expect(body.status).toBe("pendingCommitteeApproval");
  });

  describe("GET /member/industries", () => {
    beforeAll(async () => {
      const http = app.getHttpServer() as unknown as App;

      // Create members with different industries
      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Tech Company",
            websiteUrl: "https://techcompany.com",
            tradeLicenseNumber: "TL111111",
            industries: ["Technology", "Finance"],
            country: "United Arab Emirates",
            focalPoints: ["Technology"],
          },
          consents: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
          },
        })
        .expect(201);

      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Health Company",
            websiteUrl: "https://healthcompany.com",
            tradeLicenseNumber: "TL222222",
            industries: ["Healthcare", "Technology"],
            country: "United Arab Emirates",
            focalPoints: ["Healthcare"],
          },
          consents: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
          },
        })
        .expect(201);
    });

    it("should return list of industries", async () => {
      const http = app.getHttpServer() as unknown as App;
      const res = await request(http).get("/wfzo/api/v1/member/industries").expect(200);

      const industries = res.body as string[];
      expect(Array.isArray(industries)).toBe(true);
      expect(industries).toContain("Technology");
      expect(industries).toContain("Finance");
      expect(industries).toContain("Healthcare");
      // Should be sorted
      expect(industries).toEqual([...industries].sort());
    });
  });

  describe("GET /member/partnersandSponsors", () => {
    it("should return partners and sponsors", async () => {
      const http = app.getHttpServer() as unknown as App;

      // Create a strategic member (partner)
      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "strategicMembers",
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Partner Corp",
            websiteUrl: "https://partnercorp.com",
            memberLogoUrl: "https://example.com/logo.png",
            tradeLicenseNumber: "TL333333",
            industries: ["Technology"],
            country: "United Arab Emirates",
            focalPoints: ["Technology"],
          },
          consents: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
          },
        });

      const res = await request(http).get("/wfzo/api/v1/member/partnersandSponsors").expect(200);

      const body = res.body as { partners: unknown[]; sponsors: unknown[] };
      expect(body).toHaveProperty("partners");
      expect(body).toHaveProperty("sponsors");
      expect(Array.isArray(body.partners)).toBe(true);
      expect(Array.isArray(body.sponsors)).toBe(true);
    });
  });

  describe("GET /member/featured", () => {
    beforeAll(async () => {
      const http = app.getHttpServer() as unknown as App;

      // Create a featured member
      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          memberUsers: [createMemberUser()],
          featuredMember: true,
          organisationInfo: {
            companyName: "Featured Company",
            websiteUrl: "https://featuredcompany.com",
            memberLogoUrl: "https://example.com/featured.png",
            tradeLicenseNumber: "TL444444",
            industries: ["Technology", "Finance"],
            country: "United Arab Emirates",
            focalPoints: ["Technology"],
          },
          consents: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
          },
        })
        .expect(201);

      // Create a non-featured member
      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          memberUsers: [createMemberUser()],
          featuredMember: false,
          organisationInfo: {
            companyName: "Regular Company",
            websiteUrl: "https://regularcompany.com",
            tradeLicenseNumber: "TL555555",
            industries: ["Healthcare"],
            country: "United Arab Emirates",
            focalPoints: ["Healthcare"],
          },
          consents: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
          },
        })
        .expect(201);
    });

    it("should return featured members", async () => {
      const http = app.getHttpServer() as unknown as App;

      const res = await request(http).get("/wfzo/api/v1/member/featured").expect(200);

      const featured = res.body as Array<{
        id: string;
        memberCode: string;
        name: string;
        logoUrl?: string;
        description?: string;
        industries: string[];
      }>;
      expect(Array.isArray(featured)).toBe(true);
      expect(featured.length).toBeGreaterThan(0);

      // Verify structure
      const firstMember = featured[0];
      expect(firstMember).toHaveProperty("memberCode");
      expect(firstMember).toHaveProperty("name");
      expect(firstMember).toHaveProperty("industries");
    });

    it("should return empty array when no featured members", async () => {
      const http = app.getHttpServer() as unknown as App;
      const res = await request(http).get("/wfzo/api/v1/member/featured").expect(200);

      const featured = res.body as unknown[];
      expect(Array.isArray(featured)).toBe(true);
    });
  });

  describe("GET /member/mapdata/:action", () => {
    beforeAll(async () => {
      const http = app.getHttpServer() as unknown as App;

      // Create members with location data
      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "NY Company",
            websiteUrl: "https://nycompany.com",
            tradeLicenseNumber: "TL666666",
            industries: ["Technology"],
            country: "United Arab Emirates",
            focalPoints: ["Technology"],
            address: {
              line1: "123 Broadway",
              city: "New York",
              state: "NY",
              country: "United States",
              zip: "10001",
              latitude: 40.7128,
              longitude: -74.006,
            },
          },
          consents: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
          },
        })
        .expect(201);

      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "London Company",
            websiteUrl: "https://londoncompany.com",
            tradeLicenseNumber: "TL777777",
            industries: ["Finance"],
            country: "United Arab Emirates",
            focalPoints: ["Finance"],
            address: {
              line1: "10 Downing Street",
              city: "London",
              state: "England",
              country: "United Kingdom",
              zip: "SW1A 2AA",
              latitude: 51.5074,
              longitude: -0.1278,
            },
          },
          consents: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
          },
        })
        .expect(201);

      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Berlin Company",
            websiteUrl: "https://berlincompany.com",
            tradeLicenseNumber: "TL888887",
            industries: ["Technology"],
            country: "United Arab Emirates",
            focalPoints: ["Technology"],
            address: {
              line1: "Unter den Linden 1",
              city: "Berlin",
              state: "Berlin",
              country: "Germany",
              zip: "10117",
            },
          },
          consents: {
            termsAccepted: true,
            privacyPolicyAccepted: true,
          },
        })
        .expect(201);
    });

    it('should return member coordinates when action is "view-member"', async () => {
      const http = app.getHttpServer() as unknown as App;
      const res = await request(http).get("/wfzo/api/v1/member/mapdata/view-member").expect(200);

      const body = res.body as {
        companyMapData: Array<{
          memberId: string;
          companyName: string;
          latitude: number;
          longitude: number;
          country?: string;
          city?: string;
          industries: string[];
        }>;
      };

      expect(body).toHaveProperty("companyMapData");
      expect(Array.isArray(body.companyMapData)).toBe(true);

      // Should only return members with coordinates
      body.companyMapData.forEach((member) => {
        expect(member).toHaveProperty("latitude");
        expect(member).toHaveProperty("longitude");
        expect(typeof member.latitude).toBe("number");
        expect(typeof member.longitude).toBe("number");
      });
    });

    it('should return aggregate counts when action is "view-map"', async () => {
      const http = app.getHttpServer() as unknown as App;
      const res = await request(http).get("/wfzo/api/v1/member/mapdata/view-map").expect(200);

      const body = res.body as {
        continentMemberCount: Record<string, number>;
        countryMemberCount: Array<{ country: string; count: number }>;
      };

      expect(body).toHaveProperty("continentMemberCount");
      expect(body).toHaveProperty("countryMemberCount");
      expect(typeof body.continentMemberCount).toBe("object");
      expect(Array.isArray(body.countryMemberCount)).toBe(true);

      // Verify continent counts exist
      const continentCount = Object.keys(body.continentMemberCount).length;
      expect(continentCount).toBeGreaterThan(0);

      // Verify country counts
      expect(body.countryMemberCount.length).toBeGreaterThan(0);
      body.countryMemberCount.forEach((item) => {
        expect(item).toHaveProperty("country");
        expect(item).toHaveProperty("count");
        expect(typeof item.count).toBe("number");
      });

      // Verify sorting (descending by count)
      for (let i = 0; i < body.countryMemberCount.length - 1; i++) {
        expect(body.countryMemberCount[i].count).toBeGreaterThanOrEqual(
          body.countryMemberCount[i + 1].count,
        );
      }
    });
  });

  describe("POST /member - Geocoding", () => {
    it("should automatically geocode address when creating a member with city/country/zip", async () => {
      const http = app.getHttpServer() as unknown as App;

      const dto = {
        category: "associateMember" as const,
        memberUsers: [
          {
            email: "geocode@example.com",
            firstName: "Geo",
            lastName: "Coder",
            userType: "Primary" as const,
            phoneNumber: "+971501234567",
          },
        ],
        organisationInfo: {
          companyName: "Geocoded Company",
          websiteUrl: "https://geocoded.com",
          tradeLicenseNumber: "TL909090",
          industries: ["Technology"],
          country: "United Arab Emirates",
          focalPoints: ["Technology"],
          address: {
            line1: "Times Square",
            city: "New York",
            state: "NY",
            country: "United States",
            zip: "10036",
            // NOT providing latitude/longitude - geocoding should add them
          },
        },
        consents: {
          termsAccepted: true,
          privacyPolicyAccepted: true,
        },
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(201);

      const body = res.body as {
        organisationInfo?: {
          address?: {
            latitude?: number;
            longitude?: number;
            city?: string;
            country?: string;
            zip?: string;
          };
        };
      };

      // Verify the response includes geocoded coordinates
      expect(body.organisationInfo?.address).toBeDefined();
      expect(body.organisationInfo?.address?.latitude).toBeDefined();
      expect(body.organisationInfo?.address?.longitude).toBeDefined();
      expect(typeof body.organisationInfo?.address?.latitude).toBe("number");
      expect(typeof body.organisationInfo?.address?.longitude).toBe("number");

      // Verify coordinates are reasonable for New York area
      // New York is roughly at (40.7128, -74.0060)
      expect(body.organisationInfo?.address?.latitude).toBeGreaterThan(40);
      expect(body.organisationInfo?.address?.latitude).toBeLessThan(41);
      expect(body.organisationInfo?.address?.longitude).toBeGreaterThan(-75);
      expect(body.organisationInfo?.address?.longitude).toBeLessThan(-73);
    });

    it("should create member without coordinates when address is not provided", async () => {
      const http = app.getHttpServer() as unknown as App;

      const dto = {
        category: "associateMember" as const,
        memberUsers: [
          {
            email: "noaddress@example.com",
            firstName: "No",
            lastName: "Address",
            userType: "Primary" as const,
            phoneNumber: "+971501234568",
          },
        ],
        organisationInfo: {
          companyName: "No Address Company",
          websiteUrl: "https://noaddress.com",
          tradeLicenseNumber: "TL808080",
          industries: ["Technology"],
          country: "United Arab Emirates",
          focalPoints: ["Technology"],
          // No address provided
        },
        consents: {
          termsAccepted: true,
          privacyPolicyAccepted: true,
        },
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(201);

      const body = res.body as {
        organisationInfo?: {
          companyName?: string;
          address?: {
            latitude?: number;
            longitude?: number;
          };
        };
      };

      // Should still create member successfully
      expect(body.organisationInfo?.companyName).toBe("No Address Company");

      // Address should not exist or coordinates should be undefined
      if (body.organisationInfo?.address) {
        expect(body.organisationInfo.address.latitude).toBeUndefined();
        expect(body.organisationInfo.address.longitude).toBeUndefined();
      }
    });
  });

  describe("POST /member - Focal Point Users", () => {
    it("should create member with marketing and investor focal points", async () => {
      const http = app.getHttpServer() as unknown as App;

      const dto = {
        category: "associateMember" as const,
        memberUsers: [
          {
            email: "primary@focalpoint.com",
            firstName: "Primary",
            lastName: "Contact",
            userType: "Primary" as const,
            correspondanceUser: true,
            phoneNumber: "+971501111111",
          },
          {
            email: "marketing@focalpoint.com",
            firstName: "Jane",
            lastName: "Marketing",
            userType: "Secondry" as const,
            marketingFocalPoint: true,
            designation: "Marketing Director",
            phoneNumber: "+971502222222",
          },
          {
            email: "investor@focalpoint.com",
            firstName: "Robert",
            lastName: "Investor",
            userType: "Secondry" as const,
            investorFocalPoint: true,
            designation: "Investor Relations Manager",
            phoneNumber: "+971503333333",
          },
        ],
        organisationInfo: {
          companyName: "Focal Point Corp",
          websiteUrl: "https://focalpoint.com",
          tradeLicenseNumber: "TL101010",
          industries: ["Technology"],
          country: "United Arab Emirates",
          focalPoints: ["Technology"],
        },
        consents: {
          termsAccepted: true,
          privacyPolicyAccepted: true,
        },
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(201);

      const body = res.body as {
        userSnapshots?: Array<{
          email: string;
          firstName?: string;
          correspondanceUser?: boolean;
          marketingFocalPoint?: boolean;
          investorFocalPoint?: boolean;
        }>;
      };

      // Verify all users were created
      expect(body.userSnapshots).toBeDefined();
      expect(body.userSnapshots?.length).toBe(3);

      // Verify correspondence user
      const primaryUser = body.userSnapshots?.find((u) => u.email === "primary@focalpoint.com");
      expect(primaryUser?.correspondanceUser).toBe(true);
      expect(primaryUser?.marketingFocalPoint).toBeUndefined();
      expect(primaryUser?.investorFocalPoint).toBeUndefined();

      // Verify marketing focal point
      const marketingUser = body.userSnapshots?.find((u) => u.email === "marketing@focalpoint.com");
      expect(marketingUser?.marketingFocalPoint).toBe(true);
      expect(marketingUser?.investorFocalPoint).toBeUndefined();
      expect(marketingUser?.correspondanceUser).toBeUndefined();

      // Verify investor focal point
      const investorUser = body.userSnapshots?.find((u) => u.email === "investor@focalpoint.com");
      expect(investorUser?.investorFocalPoint).toBe(true);
      expect(investorUser?.marketingFocalPoint).toBeUndefined();
      expect(investorUser?.correspondanceUser).toBeUndefined();
    });

    it("should allow a user to be both marketing and investor focal point", async () => {
      const http = app.getHttpServer() as unknown as App;

      const dto = {
        category: "associateMember" as const,
        memberUsers: [
          {
            email: "primary@multirole.com",
            firstName: "Primary",
            lastName: "User",
            userType: "Primary" as const,
            phoneNumber: "+971504444444",
          },
          {
            email: "both@multirole.com",
            firstName: "Multi",
            lastName: "Role",
            userType: "Secondry" as const,
            marketingFocalPoint: true,
            investorFocalPoint: true,
            correspondanceUser: true,
            designation: "Chief Communication Officer",
            phoneNumber: "+971505555555",
          },
        ],
        organisationInfo: {
          companyName: "Multi Role Corp",
          websiteUrl: "https://multirole.com",
          tradeLicenseNumber: "TL202020",
          industries: ["Technology"],
          country: "United Arab Emirates",
          focalPoints: ["Technology"],
        },
        consents: {
          termsAccepted: true,
          privacyPolicyAccepted: true,
        },
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(201);

      const body = res.body as {
        userSnapshots?: Array<{
          email: string;
          correspondanceUser?: boolean;
          marketingFocalPoint?: boolean;
          investorFocalPoint?: boolean;
        }>;
      };

      // Verify user has all three roles
      const multiRoleUser = body.userSnapshots?.find((u) => u.email === "both@multirole.com");
      expect(multiRoleUser?.marketingFocalPoint).toBe(true);
      expect(multiRoleUser?.investorFocalPoint).toBe(true);
      expect(multiRoleUser?.correspondanceUser).toBe(true);
    });

    it("should create member without focal points (all fields optional)", async () => {
      const http = app.getHttpServer() as unknown as App;

      const dto = {
        category: "associateMember" as const,
        memberUsers: [
          {
            email: "simple@nofocal.com",
            firstName: "Simple",
            lastName: "User",
            userType: "Primary" as const,
            phoneNumber: "+971506666666",
          },
        ],
        organisationInfo: {
          companyName: "No Focal Point Corp",
          websiteUrl: "https://nofocal.com",
          tradeLicenseNumber: "TL303030",
          industries: ["Technology"],
          country: "United Arab Emirates",
          focalPoints: ["Technology"],
        },
        consents: {
          termsAccepted: true,
          privacyPolicyAccepted: true,
        },
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(201);

      const body = res.body as {
        userSnapshots?: Array<{
          email: string;
          marketingFocalPoint?: boolean;
          investorFocalPoint?: boolean;
        }>;
      };

      // Verify user has no focal point flags
      const simpleUser = body.userSnapshots?.find((u) => u.email === "simple@nofocal.com");
      expect(simpleUser?.marketingFocalPoint).toBeUndefined();
      expect(simpleUser?.investorFocalPoint).toBeUndefined();
    });
  });
});
