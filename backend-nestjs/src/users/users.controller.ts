import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import type { RequestWithUser } from '../common/types/request-with-user';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListUsersQueryDto } from './dto/list-users.query.dto';
import { PersonalAuditQueryDto } from './dto/personal-audit.query.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Search users for calendar sharing' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by username or email',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query.search);
  }

  @Get('me/audit')
  @ApiOperation({ summary: 'Get personal audit trail for current user' })
  @ApiResponse({
    status: 200,
    description: 'Personal audit trail retrieved successfully',
  })
  getPersonalAudit(
    @Request() req: RequestWithUser,
    @Query() query: PersonalAuditQueryDto,
  ) {
    return this.usersService.getPersonalAuditFeed(req.user.id, query);
  }

  @Get('me/audit/summary')
  @ApiOperation({ summary: 'Get personal audit summary for current user' })
  @ApiResponse({
    status: 200,
    description: 'Personal audit summary retrieved successfully',
  })
  async getPersonalAuditSummary(
    @Request() req: RequestWithUser,
    @Query() query: PersonalAuditQueryDto,
  ) {
    const result = await this.usersService.getPersonalAuditFeed(req.user.id, {
      ...query,
      limit: 1,
      offset: 0,
      includeAutomation: true,
    });
    return {
      summary: result.summary,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req: RequestWithUser) {
    return this.usersService.findOne(req.user.id);
  }
}
