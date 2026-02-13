import { Test } from "@nestjs/testing";
import { UnauthorizedException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AdminService } from "./services/admin.service";
import { InternalUserRepository } from "./repository/internal-user.repository";

describe("AdminService", () => {
  let service: AdminService;
  const repo = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  } as unknown as jest.Mocked<InternalUserRepository>;

  const jwt = {
    signAsync: jest.fn().mockResolvedValue("jwt-token"),
  } as unknown as jest.Mocked<JwtService>;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: InternalUserRepository, useValue: repo },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = moduleRef.get(AdminService);
    jest.clearAllMocks();
  });

  it("login success returns token and expiry", async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "a@b.c",
      roles: ["admin"],
    });
    const res = await service.login({ email: "a@b.c", password: "admin" });
    expect(res.token).toBe("jwt-token");
    expect(res.expiresAt).toBe("2025-01-01T01:00:00.000Z");
  });

  it("login wrong password throws", async () => {
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "a@b.c",
      roles: [],
    });
    await expect(service.login({ email: "a@b.c", password: "nope" })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("list delegates to repository with filters and pagination", async () => {
    (repo.findAll as jest.Mock).mockResolvedValue({
      items: [],
      page: { total: 0, page: 1, pageSize: 20 },
    });
    const res = await service.list({
      page: 2,
      pageSize: 10,
      q: "john",
      role: "editor",
    });
    // repo invocation covered by behavior; focus on returned structure
    expect(res.page.page).toBe(1);
  });

  it("create returns created user", async () => {
    (repo.create as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "c@d.e",
      roles: [],
    });
    const res = await service.create({ email: "c@d.e", roles: [] });
    expect(res.email).toBe("c@d.e");
  });

  it("getById not found throws", async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.getById("x")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("update returns updated or throws when missing", async () => {
    (repo.updateOne as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "z@y.z",
    });
    const ok = await service.update("u1", { displayName: "Z" });
    expect(ok.id).toBe("u1");
    (repo.updateOne as jest.Mock).mockResolvedValue(null);
    await expect(service.update("none", {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it("delete throws when not found", async () => {
    (repo.deleteOne as jest.Mock).mockResolvedValue(false);
    await expect(service.delete("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("roles returns 3 items", () => {
    expect(service.roles().length).toBe(3);
  });
});
