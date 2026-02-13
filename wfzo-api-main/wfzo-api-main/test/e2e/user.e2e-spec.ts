import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App as SupertestApp } from "supertest/types";
import { getModelToken } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AppModule } from "../../src/app.module";
import { applyAppSettings } from "../../src/bootstrap/app-setup";
import type { AppLike } from "../../src/bootstrap/app-setup";
import { User } from "../../src/modules/user/schemas/user.schema";
import { Member } from "../../src/modules/member/schemas/member.schema";

describe("User (e2e)", () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let memberModel: Model<Member>;
  const http = () => app.getHttpServer() as unknown as SupertestApp;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app as unknown as AppLike);
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    memberModel = moduleFixture.get<Model<Member>>(getModelToken(Member.name));
  });

  afterEach(async () => {
    // Clean up test data after each test
    await userModel.deleteMany({ username: { $in: ["qa@example.com", "e2e@example.com"] } });
    await memberModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /user returns 200 with page structure", async () => {
    const res = await request(http()).get("/wfzo/api/v1/user").expect(200);
    const body = res.body as { page: unknown; items: unknown[] };
    expect(body.page).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("POST /user then GET /user/access/:username works", async () => {
    await request(http())
      .post("/wfzo/api/v1/user")
      .send({ username: "qa@example.com", email: "qa@example.com" })
      .expect(200);

    const res = await request(http()).get("/wfzo/api/v1/user/access/qa@example.com").expect(200);
    const body = res.body as { user: { username: string }; entitlements: unknown };
    expect(body.user.username).toBe("qa@example.com");
    expect(body.entitlements).toBeDefined();
  });

  it("PUT and DELETE /user/profile/:username", async () => {
    await request(http())
      .put("/wfzo/api/v1/user/profile/e2e@example.com")
      .send({ firstName: "E2E" })
      .expect(200);

    await request(http()).delete("/wfzo/api/v1/user/profile/e2e@example.com").expect(204);
  });
});
