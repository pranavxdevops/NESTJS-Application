import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { ConnectionService } from './connection.service';
import { UnifiedAuthGuard } from '../auth/guards/unified-auth.guard';
import {
  SendConnectionRequestDto,
  UpdateConnectionStatusDto,
  GetConnectionsQueryDto,
  GetSuggestedMembersQueryDto,
  BlockMemberDto,
  UnblockMemberDto,
} from './dto/connection.dto';

@ApiTags('Connections')
@ApiBearerAuth()
@Controller('connections')
@UseGuards(UnifiedAuthGuard) // 🔒 Protect all routes with Unified Auth (Entra)
export class ConnectionController {
  private readonly logger = new Logger(ConnectionController.name);

  constructor(private readonly connectionService: ConnectionService) { }

  /**
   * Send a connection request
   * POST /wfzo/api/v1/connections/request
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async sendConnectionRequest(@Request() req: ExpressRequest & { user: any }, @Body() dto: SendConnectionRequestDto) {
    const email = req.user.email;
    this.logger.log(`User ${email} sending connection request to ${dto.recipientId}`);

    const connection = await this.connectionService.sendConnectionRequest(email, dto);

    return {
      success: true,
      message: 'Connection request sent successfully',
      data: connection,
    };
  }

  /**
   * Accept a connection request
   * PUT /wfzo/api/v1/connections/:id/accept
   */
  @Put(':id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptConnectionRequest(@Request() req: ExpressRequest & { user: any }, @Param('id') connectionId: string) {
    const email = req.user.email;
    this.logger.log(`User ${email} accepting connection request ${connectionId}`);

    const connection = await this.connectionService.acceptConnectionRequest(connectionId, email);

    return {
      success: true,
      message: 'Connection request accepted',
      data: connection,
    };
  }

  /**
   * Reject a connection request
   * PUT /wfzo/api/v1/connections/:id/reject
   */
  @Put(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectConnectionRequest(@Request() req: ExpressRequest & { user: any }, @Param('id') connectionId: string) {
    const email = req.user.email;
    this.logger.log(`User ${email} rejecting connection request ${connectionId}`);

    const connection = await this.connectionService.rejectConnectionRequest(connectionId, email);

    return {
      success: true,
      message: 'Connection request rejected',
      data: connection,
    };
  }

  /**
   * Block a user
   * PUT /wfzo/api/v1/connections/:id/block
   */
  @Put(':id/block')
  @HttpCode(HttpStatus.OK)
  async blockUser(@Request() req: ExpressRequest & { user: any }, @Param('id') connectionId: string) {
    const email = req.user.email;
    this.logger.log(`User ${email} blocking connection ${connectionId}`);

    const connection = await this.connectionService.blockUser(connectionId, email);

    return {
      success: true,
      message: 'User blocked successfully',
      data: connection,
    };
  }

  /**
   * Get my connections (accepted)
   * GET /wfzo/api/v1/connections
   */
  @Get()
  @ApiOperation({
    summary: 'Get my connections with user details for chat initiation',
    description: `Returns all accepted connections with grouped user details.
    
**Response Structure:**
- \`member.primaryUsers[]\`: Primary users (represent the member)
- \`member.secondaryUsers[]\`: Secondary users (staff/team members)

**Use Case:** This response contains all information needed to initiate chat:
- Member Chat: Use member.primaryUsers[0].userId (no recipientUserId)
- User Chat: Use any user's userId as recipientUserId

**Example Response:**
\`\`\`json
{
  "connectionId": "6965de480df16a5864de9225",
  "member": {
    "memberId": "MEMBER-060",
    "organisationInfo": {
      "companyName": "jparksky",
      "memberLogoUrl": "https://...",
      "industries": ["manufacturing"]
    },
    "primaryUsers": [
      {
        "userId": "entra-uuid-1",
        "email": "owner@jparksky.com",
        "firstName": "John",
        "lastName": "Park",
        "designation": "Director",
        "userType": "Primary",
        "memberLogoUrl": "https://..."
      }
    ],
    "secondaryUsers": [
      {
        "userId": "entra-uuid-2",
        "email": "staff@jparksky.com",
        "firstName": "Anna",
        "lastName": "Lee",
        "designation": "Engineer",
        "userType": "Secondary",
        "userLogoUrl": "https://..."
      }
    ]
  },
  "connectedAt": "2026-01-13T07:16:17.366Z",
  "status": "accepted"
}
\`\`\``,
  })
  @ApiResponse({
    status: 200,
    description: 'List of connections with user details',
  })
  async getMyConnections(@Request() req: ExpressRequest & { user: any }, @Query() query: GetConnectionsQueryDto) {
    const email = req.user.email;
    this.logger.log(`User ${email} fetching connections`);

    const result = await this.connectionService.getMyConnections(email, query);

    return {
      success: true,
      data: result.connections,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    };
  }

  /**
   * Get received connection requests (invitations)
   * GET /wfzo/api/v1/connections/requests/received
   */
  @Get('requests/received')
  async getReceivedRequests(@Request() req: ExpressRequest & { user: any }, @Query() query: GetConnectionsQueryDto) {
    const email = req.user.email;
    this.logger.log(`User ${email} fetching received connection requests`);

    const result = await this.connectionService.getReceivedRequests(email, query);

    return {
      success: true,
      data: result.requests,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    };
  }

  /**
   * Get sent connection requests (outgoing)
   * GET /wfzo/api/v1/connections/requests/sent
   */
  @Get('requests/sent')
  @ApiOperation({
    summary: 'Get sent connection requests',
    description: `Returns a paginated list of connection requests sent by the current user.

**Response Structure:**
- \`data[]\`: List of sent requests
- \`data[].member\`: Details of the recipient member
- \`pagination\`: Pagination metadata`,
  })
  @ApiResponse({
    status: 200,
    description: 'List of sent connection requests',
    schema: {
      example: {
        success: true,
        data: [
          {
            "requestId": "65b2f...89",
            "member": {
              "memberId": "MEMBER-123",
              "organisationInfo": {
                "companyName": "Target Company",
                "memberLogoUrl": "https://example.com/logo.png",
                "address": {
                  "city": "Dubai",
                  "country": "UAE"
                },
                "industries": ["Technology"]
              }
            },
            "note": "Let's connect!",
            "requestedAt": "2024-01-25T10:00:00.000Z"
          }
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 5,
          totalPages: 1
        }
      }
    }
  })
  async getSentRequests(@Request() req: ExpressRequest & { user: any }, @Query() query: GetConnectionsQueryDto) {
    const email = req.user.email;
    this.logger.log(`User ${email} fetching sent connection requests`);

    const result = await this.connectionService.getSentRequests(email, query);

    return {
      success: true,
      data: result.requests,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    };
  }

  /**
   * Get suggested members
   * GET /wfzo/api/v1/connections/suggestions
   */
  @Get('suggestions')
  async getSuggestedMembers(@Request() req: ExpressRequest & { user: any }, @Query() query: GetSuggestedMembersQueryDto) {
    const email = req.user.email;
    const page = parseInt(query.page || '1', 10);
    const pageSize = parseInt(query.pageSize || '5', 10);

    this.logger.log(`User ${email} fetching suggested members (page ${page})`);

    const result = await this.connectionService.getSuggestedMembers(email, page, pageSize);

    return {
      success: true,
      data: result.members,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
        hasMore: page * pageSize < result.total,
      },
    };
  }

  /**
   * Check if connected with a specific user
   * GET /wfzo/api/v1/connections/check/:userId
   */
  @Get('check/:userId')
  async checkConnection(@Request() req: ExpressRequest & { user: any }, @Param('userId') otherUserId: string) {
    const userId = req.user.keycloakUserId || req.user.sub;

    const isConnected = await this.connectionService.areUsersConnected(userId, otherUserId);

    return {
      success: true,
      data: {
        isConnected,
      },
    };
  }

  /**
   * Remove connection (hard delete)
   * DELETE /wfzo/api/v1/connections/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Remove connection',
    description: 'Hard deletes a connection. The connection will be completely removed from the database and will not appear in the connections list.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Connection removed successfully',
    schema: {
      example: {
        success: true,
        message: 'Connection removed successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  @ApiResponse({ status: 400, description: 'Cannot remove this connection' })
  async removeConnection(@Request() req: ExpressRequest & { user: any }, @Param('id') connectionId: string) {
    const email = req.user.email;
    this.logger.log(`User ${email} removing connection ${connectionId}`);

    const result = await this.connectionService.removeConnection(connectionId, email);

    return result;
  }

  /**
   * Block member (organization-wide)
   * POST /wfzo/api/v1/connections/:id/block-member
   */
  @Post(':id/block-member')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Block member (organization-wide)',
    description: 'Blocks an entire organization. All users from both organizations will be blocked from communicating. Creates cascade block entries for all user combinations.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Member blocked successfully',
    schema: {
      example: {
        success: true,
        message: 'Member MEMBER-060 blocked successfully (all users affected)',
        blocksCreated: 8
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  @ApiResponse({ status: 400, description: 'Cannot block your own organization' })
  async blockMember(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') connectionId: string,
    @Body() dto: BlockMemberDto,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} blocking member ${dto.blockedMemberId} in connection ${connectionId}`);

    const result = await this.connectionService.blockMember(connectionId, dto.blockedMemberId, email);

    return result;
  }

  /**
   * Unblock member (organization-wide)
   * POST /wfzo/api/v1/connections/:id/unblock-member
   */
  @Post(':id/unblock-member')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Unblock member (organization-wide)',
    description: 'Removes all member-level blocks between two organizations. User-level blocks (if any) remain unchanged.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Member unblocked successfully',
    schema: {
      example: {
        success: true,
        message: 'Member MEMBER-060 unblocked successfully',
        blocksRemoved: 8
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Connection or blocks not found' })
  async unblockMember(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') connectionId: string,
    @Body() dto: UnblockMemberDto,
  ) {
    const email = req.user.email;
    this.logger.log(`User ${email} unblocking member ${dto.unblockedMemberId} in connection ${connectionId}`);

    const result = await this.connectionService.unblockMember(connectionId, dto.unblockedMemberId, email);

    return result;
  }
}
