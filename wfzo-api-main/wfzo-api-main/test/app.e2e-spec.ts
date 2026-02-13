import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import { AppModule } from "./../src/app.module";
import { applyAppSettings } from "../src/bootstrap/app-setup";
import type { AppLike } from "../src/bootstrap/app-setup";

describe("App (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyAppSettings(app as unknown as AppLike);
    await app.init();
  });

  it("/docs (GET)", async () => {
    const res = await request(app.getHttpServer()).get("/docs/");
    expect(res.status).toBe(200);
  });
});
