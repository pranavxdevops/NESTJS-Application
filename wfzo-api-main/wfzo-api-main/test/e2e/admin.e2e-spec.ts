import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App as SupertestApp } from "supertest/types";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AppModule } from "../../src/app.module";
import { applyAppSettings } from "../../src/bootstrap/app-setup";
import type { AppLike } from "../../src/bootstrap/app-setup";
import { getModelToken } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { InternalUser } from "../../src/modules/admin/schemas/internal-user.schema";

/**
 * Minimal e2e for Admin:
 * - login to get JWT
 * - list should require auth
 * - list should work with token (empty dataset ok)
 */
describe("Admin (e2e)", () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let token: string;
  const http = () => app.getHttpServer() as unknown as SupertestApp;

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

  it("POST /internal/user/login returns token", async () => {
    // Seed a minimal user directly via endpoint for simplicity
    // Create user requires auth; so insert via repo would need DI. Instead, rely on login placeholder password 'admin'.
    // We'll first create via controller: not allowed. So we'll insert using the repository through a test-only endpoint in future.
    // For now, simulate: create via admin service repo is out of scope; instead, bypass by creating one via mongoose model would require access.
    // Simpler: adjust service to accept any email and admin password. It already checks existence. We need a user to exist.
    // Workaround: try creating a user using Member or skip seed and expect 401. We'll seed by calling the protected create with a fake token: should fail. So we'll create directly by connecting to model

    // Directly insert a user using the Mongoose model retrieved via Nest token
    const userModel = app.get<Model<InternalUser>>(getModelToken(InternalUser.name));
    await userModel.create({
      email: "admin@example.com",
      roles: ["admin"],
      status: "active",
    });

    const res = await request(http())
      .post("/wfzo/api/v1/internal/user/login")
      .send({ email: "admin@example.com", password: "admin" })
      .expect(200);
    const body = res.body as unknown as { token: string };
    expect(body.token).toBeDefined();
    token = body.token;
  });

  it("POST /internal/user/login returns 401 on wrong password", async () => {
    const res = await request(http())
      .post("/wfzo/api/v1/internal/user/login")
      .send({ email: "admin@example.com", password: "wrong" })
      .expect(401);
    expect(res.body).toBeDefined();
  });

  it("GET /internal/user requires auth", async () => {
    await request(http()).get("/wfzo/api/v1/internal/user").expect(401);
  });

  it("GET /internal/user with token returns list", async () => {
    const res = await request(http())
      .get("/wfzo/api/v1/internal/user?page=1&pageSize=10")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const body = res.body as unknown as {
      items: unknown[];
      page: { total: number; page: number; pageSize: number };
    };
    expect(body).toBeDefined();
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.page).toBeDefined();
  });

  it("Admin CRUD flow with auth: create, get, update, delete", async () => {
    // create a user
    const createRes = await request(http())
      .post("/wfzo/api/v1/internal/user")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "flow@user.com", roles: ["viewer"] })
      .expect(201);
    const created = createRes.body as { id: string; email: string };
    expect(created.email).toBe("flow@user.com");

    // get by id
    const getRes = await request(http())
      .get(`/wfzo/api/v1/internal/user/${created.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const got = getRes.body as { id: string };
    expect(got.id).toBe(created.id);

    // update
    const upd = await request(http())
      .put(`/wfzo/api/v1/internal/user/${created.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ displayName: "Flow User" })
      .expect(200);
    const updated = upd.body as { displayName?: string };
    expect(updated.displayName).toBe("Flow User");

    // delete
    await request(http())
      .delete(`/wfzo/api/v1/internal/user/${created.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    // verify 404 after delete
    await request(http())
      .get(`/wfzo/api/v1/internal/user/${created.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });

  it("GET /internal/user/roles returns 3 roles (auth)", async () => {
    const res = await request(http())
      .get("/wfzo/api/v1/internal/user/roles")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    const roles = res.body as Array<{ key: string; name: string }>;
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBe(3);
  });
});
