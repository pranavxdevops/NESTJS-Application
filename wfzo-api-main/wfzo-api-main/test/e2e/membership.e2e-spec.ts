import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request, { type Response as SupertestResponse } from "supertest";
import { MongooseModule, getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ConfigModule } from "../../src/shared/config/config.module";
import { ConfigService } from "../../src/shared/config/config.service";
import { MembershipModule } from "../../src/modules/membership/membership.module";
import { MembershipFeatures } from "../../src/modules/membership/dto/membership.dto";
import { Membership } from "../../src/modules/membership/schemas/membership.schema";

describe("Membership E2E", () => {
  let app: INestApplication;
  let membershipModel: Model<Membership>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            uri: config.getMongoUri(),
          }),
          inject: [ConfigService],
        }),
        MembershipModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("/wfzo/api/v1");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    membershipModel = moduleRef.get<Model<Membership>>(getModelToken(Membership.name));
  });

  afterEach(async () => {
    // Clean up database after each test
    await membershipModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /membership/features/:type", () => {
    it("should return 404 when membership type does not exist", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpServer = app.getHttpServer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(httpServer).get("/wfzo/api/v1/membership/features/nonexistent").expect(404);
    });
  });

  describe("POST /membership/features/:type", () => {
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
        "library.downloads": {
          access: "restricted",
          quota: {
            kind: "downloads",
            limit: 500,
            used: 0,
            remaining: 500,
            window: "monthly",
          },
        },
        "community.access": {
          access: "unlimited",
        },
      },
      description: "Premium membership with full access",
    };

    it("should create a new membership", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpServer = app.getHttpServer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res: SupertestResponse = await request(httpServer)
        .post("/wfzo/api/v1/membership/features/premium")
        .send(createDto)
        .expect(201);

      const body = res.body as MembershipFeatures;
      expect(body.type).toBe("premium");
      expect(body.entitlements).toBeDefined();
      expect(body.entitlements["events.seats"]).toBeDefined();
      expect(body.generatedAt).toBeDefined();
    });

    it("should return the created membership when GET is called", async () => {
      // First create the membership
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpServer = app.getHttpServer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(httpServer)
        .post("/wfzo/api/v1/membership/features/premium")
        .send(createDto)
        .expect(201);

      // Then retrieve it
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res: SupertestResponse = await request(httpServer)
        .get("/wfzo/api/v1/membership/features/premium")
        .expect(200);

      const body = res.body as MembershipFeatures;
      expect(body.type).toBe("premium");
      expect(body.entitlements).toBeDefined();
      expect(Object.keys(body.entitlements).length).toBeGreaterThan(0);
    });

    it("should update existing membership", async () => {
      // First create
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpServer = app.getHttpServer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(httpServer)
        .post("/wfzo/api/v1/membership/features/premium")
        .send(createDto)
        .expect(201);

      // Then update
      const updateDto = {
        ...createDto,
        description: "Updated premium membership",
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res: SupertestResponse = await request(httpServer)
        .post("/wfzo/api/v1/membership/features/premium")
        .send(updateDto)
        .expect(201);

      const body = res.body as MembershipFeatures;
      expect(body.type).toBe("premium");
    });

    it("should return 400 for invalid data", async () => {
      const invalidDto = {
        type: "",
        entitlements: {},
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpServer = app.getHttpServer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(httpServer)
        .post("/wfzo/api/v1/membership/features/test")
        .send(invalidDto)
        .expect(400);
    });
  });

  describe("DELETE /membership/features/:type", () => {
    it("should soft delete a membership", async () => {
      // First create
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpServer = app.getHttpServer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(httpServer)
        .post("/wfzo/api/v1/membership/features/premium")
        .send({
          type: "premium",
          entitlements: {
            "events.seats": {
              access: "restricted",
            },
          },
          description: "Test Premium",
        })
        .expect(201);

      // Then delete
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(httpServer).delete("/wfzo/api/v1/membership/features/premium").expect(204);
    });

    it("should return 404 after deletion when trying to GET", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpServer = app.getHttpServer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(httpServer).get("/wfzo/api/v1/membership/features/premium").expect(404);
    });

    it("should return 404 when trying to delete non-existent membership", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const httpServer = app.getHttpServer();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(httpServer).delete("/wfzo/api/v1/membership/features/nonexistent").expect(404);
    });
  });
});
