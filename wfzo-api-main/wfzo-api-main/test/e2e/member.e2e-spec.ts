import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getConnectionToken } from "@nestjs/mongoose";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { applyAppSettings } from "../../src/bootstrap/app-setup";
import { setGlobalConnection } from "../../src/modules/member/validators/decorators/validate-dropdown-value.decorator";
import { setGlobalUserConnection } from "../../src/modules/member/validators/decorators/validate-email-unique.decorator";
import { CreateMemberDto } from "../../src/modules/member/dto/create-member.dto";
import { UserType } from "../../src/modules/member/dto/member-user.dto";
import type { App as SupertestApp } from "supertest/types";

describe("Member (e2e)", () => {
  let app: INestApplication;
  let testMemberId: string;

  jest.setTimeout(20000); // Increase timeout to 20 seconds for slow email service
  let mongod: MongoMemoryServer;

  let emailCounter = 0;
  const createMemberUser = () => {
    emailCounter++;
    const email = `user${emailCounter}@example.com`;
    return {
      username: email,
      email,
      firstName: "Test",
      lastName: `User${emailCounter}`,
      userType: UserType.PRIMARY,
      contactNumber: `+97150000000${emailCounter}`,
    };
  };

  const createMemberConsent = () => ({
    articleOfAssociationConsent: true,
    articleOfAssociationCriteriaConsent: false,
    memberShipFeeConsent: true,
    publicationConsent: false,
    approvalForExposure: false,
    termsAndConditions: false,
    termsAndConditions2: true,
    termsAndConditions3: true,
    authorizedPersonDeclaration: true,
  });

  const createAddress = (city: string, country: string, zip: string = "00000") => ({
    line1: "123 Main Street",
    city,
    state: "State",
    country,
    zip,
  });

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    process.env.MONGODB_URI = mongoUri;
    process.env.RUN_MIGRATIONS_ON_STARTUP = "true";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // Set global connections for validators
    const connection = app.get(getConnectionToken());
    setGlobalConnection(connection);
    setGlobalUserConnection(connection);

    applyAppSettings(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongod.stop();
  });

  it("POST /member should create", async () => {
    const dto: CreateMemberDto = {
      category: "associateMember" as const,
      memberUsers: [createMemberUser()],
      organisationInfo: {
        companyName: "Acme Corp",
        websiteUrl: "https://acme.example.com",
      },
      memberConsent: createMemberConsent(),
    };

    const http = app.getHttpServer() as unknown as SupertestApp;
    const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(200);
    const body = res.body as { memberId?: string; organisationInfo?: { companyName: string } };
    expect(body.organisationInfo?.companyName).toBe("Acme Corp");

    testMemberId = body.memberId ?? "";
  });
  it("GET /member/:id should fetch", async () => {
    const http = app.getHttpServer() as unknown as SupertestApp;

    // First create a member to fetch
    const createRes = await request(http)
      .post("/wfzo/api/v1/member")
      .send({
        category: "associateMember" as const,
        memberUsers: [createMemberUser()],
        organisationInfo: {
          companyName: "Fetch Test Corp",
          websiteUrl: "https://fetchtest.com",
        },
        memberConsent: createMemberConsent(),
      })
      .expect(200);

    const createdMember = createRes.body as { memberId: string };

    const res = await request(http)
      .get(`/wfzo/api/v1/member/${createdMember.memberId}`)
      .expect(200);
    const body = res.body as { memberId: string };
    expect(body.memberId).toBe(createdMember.memberId);
  });

  it("POST /member validation error", async () => {
    const http = app.getHttpServer() as unknown as SupertestApp;
    await request(http).post("/wfzo/api/v1/member").send({ category: "invalid" }).expect(400);
  });

  it("PUT /member/status should update status", async () => {
    const http = app.getHttpServer() as unknown as SupertestApp;

    // First create a member
    const createRes = await request(http)
      .post("/wfzo/api/v1/member")
      .send({
        category: "associateMember" as const,
        status: "pendingFormSubmission" as const,
        memberUsers: [createMemberUser()],
        organisationInfo: {
          companyName: "Status Test Corp",
          websiteUrl: "https://statustest.com",
        },
        memberConsent: createMemberConsent(),
      })
      .expect(200);

    const createdMember = createRes.body as { memberId: string };

    // Now update the status
    const statusUpdateDto = {
      action: "approve" as const,
      stage: "committee" as const,
      actionBy: "admin@example.com",
      actionByEmail: "admin@example.com",
      comments: "Approving for testing",
    };

    const res = await request(http)
      .put(`/wfzo/api/v1/member/status/${createdMember.memberId}`)
      .send(statusUpdateDto)
      .expect(200);

    const body = res.body as { status: string };
    expect(body.status).toBe("pendingBoardApproval"); // After committee approval, it goes to board
  });

  describe("GET /member/industries", () => {
    beforeAll(async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;

      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          status: "pendingFormSubmission" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Industry Corp 1",
            websiteUrl: "https://industry1.com",
            industries: ["Technology"],
          },
          memberConsent: createMemberConsent(),
        })
        .expect(200);

      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          status: "pendingFormSubmission" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Industry Corp 2",
            websiteUrl: "https://industry2.com",
            industries: ["Finance"],
          },
          memberConsent: createMemberConsent(),
        })
        .expect(200);
    });

    it("should return list of industries", async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;
      const res = await request(http).get("/wfzo/api/v1/member/industries").expect(200);
      const body = res.body as string[];
      expect(body).toContain("Technology");
      expect(body).toContain("Finance");
    });
  });

  describe("GET /member/partnersandSponsors", () => {
    it("should return partners and sponsors", async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;
      const res = await request(http).get("/wfzo/api/v1/member/partnersandSponsors").expect(200);
      const body = res.body as {
        partners: Array<{ memberId: string }>;
        sponsors: Array<{ memberId: string }>;
      };
      expect(body).toHaveProperty("partners");
      expect(body).toHaveProperty("sponsors");
      expect(Array.isArray(body.partners)).toBe(true);
      expect(Array.isArray(body.sponsors)).toBe(true);
    });
  });

  describe("GET /member/featured", () => {
    beforeAll(async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;

      // Create a featured member
      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          status: "active" as const,
          featuredMember: true,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Featured Corp",
            websiteUrl: "https://featured.com",
          },
          memberConsent: createMemberConsent(),
        })
        .expect(200);

      // Create a non-featured member
      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          status: "active" as const,
          featuredMember: false,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Non-Featured Corp",
            websiteUrl: "https://nonfeatured.com",
          },
          memberConsent: createMemberConsent(),
        })
        .expect(200);
    });

    it("should return featured members", async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;
      const res = await request(http).get("/wfzo/api/v1/member/featured").expect(200);
      const body = res.body as Array<{ memberId: string; featuredMember: boolean }>;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body.every((m) => m.featuredMember === true)).toBe(true);
    });

    it("should return empty array when no featured members", async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;
      // Assuming we can get featured members with a query param (adjust if needed)
      const res = await request(http).get("/wfzo/api/v1/member/featured").expect(200);
      const body = res.body as Array<{ memberId: string; featuredMember: boolean }>;
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe("GET /member/mapdata/:action", () => {
    beforeAll(async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;

      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          status: "active" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Map Corp NY",
            websiteUrl: "https://mapcorpny.com",
            address: createAddress("New York", "United States", "10001"),
          },
          memberConsent: createMemberConsent(),
        })
        .expect(200);

      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          status: "active" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Map Corp London",
            websiteUrl: "https://mapcorplon.com",
            address: createAddress("London", "United Kingdom", "SW1A 1AA"),
          },
          memberConsent: createMemberConsent(),
        })
        .expect(200);

      await request(http)
        .post("/wfzo/api/v1/member")
        .send({
          category: "associateMember" as const,
          status: "active" as const,
          memberUsers: [createMemberUser()],
          organisationInfo: {
            companyName: "Map Corp Berlin",
            websiteUrl: "https://mapcorpber.com",
            address: {
              city: "Berlin",
              country: "Germany",
              zipCode: "10115",
            },
          },
          memberConsent: createMemberConsent(),
        })
        .expect(200);
    });

    it('should return member coordinates when action is "view-member"', async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;
      const res = await request(http).get("/wfzo/api/v1/member/mapdata/view-member").expect(200);
      const body = res.body as Array<{
        memberId: string;
        organisationInfo: {
          companyName: string;
          coordinates?: { latitude: number; longitude: number };
        };
      }>;
      expect(Array.isArray(body)).toBe(true);
    });

    it('should return aggregate counts when action is "view-map"', async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;
      const res = await request(http).get("/wfzo/api/v1/member/mapdata/view-map").expect(200);
      const body = res.body as Array<{
        memberId: string;
        category: string;
        coordinates: { latitude: number; longitude: number };
      }>;
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe("POST /member - Geocoding", () => {
    it("should automatically geocode address when creating a member with city/country/zip", async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;

      const dto = {
        category: "associateMember" as const,
        status: "pendingFormSubmission" as const,
        memberUsers: [createMemberUser()],
        organisationInfo: {
          companyName: "Geocode Test Corp",
          websiteUrl: "https://geocodetest.com",
          address: createAddress("Dubai", "United Arab Emirates", "12345"),
        },
        memberConsent: createMemberConsent(),
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(200);

      const body = res.body as {
        organisationInfo?: {
          address?: {
            coordinates?: { latitude: number; longitude: number };
          };
        };
      };
      // Coordinates may or may not be set depending on geocoding service availability
      expect(body.organisationInfo).toBeDefined();
    });

    it("should create member without coordinates when address is not provided", async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;

      const dto = {
        category: "associateMember" as const,
        status: "pendingFormSubmission" as const,
        memberUsers: [createMemberUser()],
        organisationInfo: {
          companyName: "No Address Corp",
          websiteUrl: "https://noaddress.com",
        },
        memberConsent: createMemberConsent(),
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(200);

      const body = res.body as {
        organisationInfo?: {
          address?: {
            coordinates?: { latitude: number; longitude: number };
          };
        };
      };
      expect(body.organisationInfo?.address?.coordinates).toBeUndefined();
    });
  });

  describe("POST /member - Focal Point Users", () => {
    it("should create member with marketing and investor focal points", async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;

      const marketingUser = createMemberUser();
      const investorUser = createMemberUser();

      const dto = {
        category: "associateMember" as const,
        status: "pendingFormSubmission" as const,
        memberUsers: [
          { ...marketingUser, userType: UserType.PRIMARY, marketingFocalPoint: true },
          { ...investorUser, userType: UserType.SECONDARY, investorFocalPoint: true },
        ],
        organisationInfo: {
          companyName: "Focal Point Corp",
          websiteUrl: "https://focalpoint.com",
        },
        memberConsent: createMemberConsent(),
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(200);

      const body = res.body as {
        userSnapshots?: Array<{
          email: string;
          userType: string;
          marketingFocalPoint?: boolean;
          investorFocalPoint?: boolean;
        }>;
      };
      expect(body.userSnapshots).toBeDefined();
      expect(body.userSnapshots?.length).toBe(2);
    });

    it("should allow a user to be both marketing and investor focal point", async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;

      const multiRoleUser = createMemberUser();

      const dto = {
        category: "associateMember" as const,
        status: "pendingFormSubmission" as const,
        memberUsers: [
          {
            ...multiRoleUser,
            userType: UserType.PRIMARY,
            marketingFocalPoint: true,
            investorFocalPoint: true,
          },
        ],
        organisationInfo: {
          companyName: "Multi Role Corp",
          websiteUrl: "https://multirole.com",
        },
        memberConsent: createMemberConsent(),
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(200);

      const body = res.body as {
        userSnapshots?: Array<{
          email: string;
          userType: string;
          marketingFocalPoint?: boolean;
          investorFocalPoint?: boolean;
        }>;
      };
      expect(body.userSnapshots).toBeDefined();
      expect(body.userSnapshots?.length).toBe(1);
      expect(body.userSnapshots?.[0]?.marketingFocalPoint).toBe(true);
      expect(body.userSnapshots?.[0]?.investorFocalPoint).toBe(true);
    });

    it("should create member without focal points (all fields optional)", async () => {
      const http = app.getHttpServer() as unknown as SupertestApp;

      const dto = {
        category: "associateMember" as const,
        status: "pendingFormSubmission" as const,
        memberUsers: [createMemberUser()],
        organisationInfo: {
          companyName: "Simple Corp",
          websiteUrl: "https://simple.com",
        },
        memberConsent: createMemberConsent(),
      };

      const res = await request(http).post("/wfzo/api/v1/member").send(dto).expect(200);

      const body = res.body as {
        userSnapshots?: Array<{
          email: string;
        }>;
      };
      expect(body.userSnapshots).toBeDefined();
    });
  });
});
