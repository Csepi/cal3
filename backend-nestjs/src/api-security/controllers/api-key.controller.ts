import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from '../../common/types/request-with-user';
import { CreateApiKeyDto, CreateApiKeyResponseDto } from '../dto/api-key.dto';
import { ApiKeyService } from '../services/api-key.service';

@ApiTags('API Security')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  @ApiOperation({ summary: 'List API keys for current user' })
  @ApiResponse({ status: 200, description: 'API keys returned.' })
  async list(@Req() req: RequestWithUser) {
    return this.apiKeyService.listForUser(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create API key for current user' })
  @ApiResponse({
    status: 201,
    description: 'API key created (plaintext returned once).',
    type: CreateApiKeyResponseDto,
  })
  async create(
    @Req() req: RequestWithUser,
    @Body() body: CreateApiKeyDto,
  ): Promise<CreateApiKeyResponseDto> {
    return this.apiKeyService.createForUser(req.user.id, body);
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotate an API key' })
  @ApiResponse({ status: 200, description: 'API key rotated.' })
  async rotate(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.apiKeyService.rotateForUser(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked.' })
  async revoke(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: true }> {
    await this.apiKeyService.revokeForUser(req.user.id, id);
    return { success: true };
  }
}
