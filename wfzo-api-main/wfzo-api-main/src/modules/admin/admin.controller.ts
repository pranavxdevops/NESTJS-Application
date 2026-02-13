import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./services/admin.service";
import { InternalLoginRequestDto, InternalLoginResponseDto } from "./dto/internal-login.dto";
import {
  InternalUserCreateRequestDto,
  InternalUserDto,
  InternalUserListDataDto,
  InternalUserUpdateRequestDto,
  RoleDto,
} from "./dto/internal-user.dto";
import { RoleListItemDto } from "./dto/role-list.dto";
import { CreateRoleDto, UpdateRoleDto } from "./dto/role-management.dto";
import { JwtAuthGuard } from "@modules/auth/guards/jwt.guard";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { Roles } from "@modules/auth/roles.decorator";

@ApiTags("Admin")
@Controller("internal/user")
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Post("login")
  @ApiOperation({ summary: "Internal user login" })
  @ApiOkResponse({ type: InternalLoginResponseDto })
  @HttpCode(200)
  async login(@Body() dto: InternalLoginRequestDto): Promise<InternalLoginResponseDto> {
    return this.service.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiOkResponse({ type: InternalUserDto })
  async getCurrentUser(@Request() req: any): Promise<InternalUserDto> {
    return this.service.getById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "EDITOR") // ✅ Use uppercase to match role codes in database
  @ApiBearerAuth()
  @Get()
  @ApiOkResponse({ type: InternalUserListDataDto })
  async list(
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
    @Query("q") q?: string,
    @Query("role") role?: string,
  ) {
    return this.service.list({ page, pageSize, q, role });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN") // ✅ Only admin role can create users
  @ApiBearerAuth()
  @Post()
  @ApiOkResponse({ type: InternalUserDto })
  async create(@Body() dto: InternalUserCreateRequestDto): Promise<InternalUserDto> {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("roles/list")
  @ApiOperation({
    summary: "Get list of roles for UI selection",
    description: "Returns simplified list of roles for internal user creation/editing forms",
  })
  @ApiOkResponse({ type: [RoleListItemDto] })
  async listRoles(): Promise<RoleListItemDto[]> {
    return this.service.listRoles();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("roles")
  @ApiOperation({
    summary: "Get all roles and privileges",
    description:
      "Returns complete roles and privileges structure for use in frontend and backend authorization",
  })
  @ApiOkResponse({ type: Object })
  async getRolesAndPrivileges() {
    return this.service.getRolesAndPrivileges();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(":userId")
  @ApiOkResponse({ type: InternalUserDto })
  async getById(@Param("userId") userId: string): Promise<InternalUserDto> {
    return this.service.getById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(":userId")
  @ApiOkResponse({ type: InternalUserDto })
  async update(
    @Param("userId") userId: string,
    @Body() dto: InternalUserUpdateRequestDto,
  ): Promise<InternalUserDto> {
    return this.service.update(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(":userId")
  @HttpCode(204)
  async delete(@Param("userId") userId: string): Promise<void> {
    return this.service.delete(userId);
  }

  // ========== Role Management Endpoints ==========

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post("roles")
  @ApiOperation({
    summary: "Create a new role",
    description: "Create a new role with specified privileges (Admin only)",
  })
  @ApiOkResponse({ type: Object })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.service.createRole(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put("roles/:roleName")
  @ApiOperation({
    summary: "Update an existing role",
    description: "Update role properties and privileges (Admin only)",
  })
  @ApiOkResponse({ type: Object })
  async updateRole(@Param("roleName") roleName: string, @Body() dto: UpdateRoleDto) {
    return this.service.updateRole(roleName, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete("roles/:roleName")
  @ApiOperation({
    summary: "Delete a role (soft delete)",
    description: "Deactivate a role by setting isActive=false (Admin only)",
  })
  @HttpCode(204)
  async deleteRole(@Param("roleName") roleName: string): Promise<void> {
    return this.service.deleteRole(roleName);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("roles/:roleName")
  @ApiOperation({
    summary: "Get a specific role",
    description: "Get details of a specific role including its privileges",
  })
  @ApiOkResponse({ type: Object })
  async getRole(@Param("roleName") roleName: string) {
    return this.service.getRole(roleName);
  }
}
