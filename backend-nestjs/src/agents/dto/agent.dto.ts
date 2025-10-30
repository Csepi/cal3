import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
  IsIn,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AgentStatus } from '../../entities/agent-profile.entity';
import { AgentActionKey } from '../agent-actions.registry';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;
}

export class AgentPermissionInputDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(AgentActionKey))
  actionKey: AgentActionKey;

  @IsOptional()
  @IsObject()
  scope?: Record<string, any>;
}

export class UpdateAgentPermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentPermissionInputDto)
  permissions: AgentPermissionInputDto[];
}

export class CreateAgentKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label: string;
}

export class RevokeAgentKeyDto {
  @IsUUID()
  keyTokenId: string;
}

export class ExecuteAgentActionDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(AgentActionKey))
  action: AgentActionKey;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}
