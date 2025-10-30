import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  MaxLength,
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TriggerType,
  ConditionLogic,
} from '../../entities/automation-rule.entity';
import {
  ConditionField,
  ConditionOperator,
  ConditionLogicOperator,
} from '../../entities/automation-condition.entity';
import { ActionType } from '../../entities/automation-action.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO for creating a condition
export class CreateConditionDto {
  @ApiProperty({ enum: ConditionField, description: 'Event field to check' })
  @IsEnum(ConditionField)
  field: ConditionField;

  @ApiProperty({ enum: ConditionOperator, description: 'Comparison operator' })
  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  @ApiProperty({
    description: 'Expected value (stored as string)',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  value: string;

  @ApiPropertyOptional({ description: 'Group UUID for nested logic (future)' })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({
    enum: ConditionLogicOperator,
    description: 'Logic operator to next condition',
    default: ConditionLogicOperator.AND,
  })
  @IsEnum(ConditionLogicOperator)
  logicOperator: ConditionLogicOperator;

  @ApiPropertyOptional({ description: 'Evaluation order', default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

// DTO for creating an action
export class CreateActionDto {
  @ApiProperty({ enum: ActionType, description: 'Type of action to execute' })
  @IsEnum(ActionType)
  actionType: ActionType;

  @ApiProperty({
    description: 'Action-specific configuration (JSON)',
    example: { color: '#3b82f6' },
  })
  @IsOptional()
  actionConfig: Record<string, any>;

  @ApiPropertyOptional({ description: 'Execution order', default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

// DTO for creating an automation rule
export class CreateAutomationRuleDto {
  @ApiProperty({
    description: 'Rule name (1-200 characters, unique per user)',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Optional description', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    enum: TriggerType,
    description: 'Trigger that starts the rule',
  })
  @IsEnum(TriggerType)
  triggerType: TriggerType;

  @ApiPropertyOptional({
    description: 'Trigger-specific configuration (JSON)',
    example: { minutes: 30 },
  })
  @IsOptional()
  triggerConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether rule is active', default: true })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({
    enum: ConditionLogic,
    description: 'Root-level logic operator',
    default: ConditionLogic.AND,
  })
  @IsOptional()
  @IsEnum(ConditionLogic)
  conditionLogic?: ConditionLogic;

  @ApiPropertyOptional({
    description: 'List of conditions (max 10, optional)',
    type: [CreateConditionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConditionDto)
  @ArrayMaxSize(10)
  conditions?: CreateConditionDto[];

  @ApiProperty({
    description: 'List of actions (1-5 required)',
    type: [CreateActionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActionDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  actions: CreateActionDto[];
}

// DTO for updating an automation rule
export class UpdateAutomationRuleDto {
  @ApiPropertyOptional({
    description: 'Rule name',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Description', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether rule is active' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Trigger-specific configuration' })
  @IsOptional()
  triggerConfig?: Record<string, any>;

  @ApiPropertyOptional({
    enum: ConditionLogic,
    description: 'Root-level logic operator',
  })
  @IsOptional()
  @IsEnum(ConditionLogic)
  conditionLogic?: ConditionLogic;

  @ApiPropertyOptional({
    description: 'Replace all conditions',
    type: [CreateConditionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateConditionDto)
  @ArrayMaxSize(10)
  conditions?: CreateConditionDto[];

  @ApiPropertyOptional({
    description: 'Replace all actions',
    type: [CreateActionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActionDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  actions?: CreateActionDto[];
}

// Response DTO for condition
export class ConditionDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ConditionField })
  field: ConditionField;

  @ApiProperty({ enum: ConditionOperator })
  operator: ConditionOperator;

  @ApiProperty()
  value: string;

  @ApiPropertyOptional()
  groupId: string | null;

  @ApiProperty({ enum: ConditionLogicOperator })
  logicOperator: ConditionLogicOperator;

  @ApiProperty()
  order: number;
}

// Response DTO for action
export class ActionDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ActionType })
  actionType: ActionType;

  @ApiProperty()
  actionConfig: Record<string, any>;

  @ApiProperty()
  order: number;
}

// Response DTO for automation rule (summary)
export class AutomationRuleDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty({ enum: TriggerType })
  triggerType: TriggerType;

  @ApiPropertyOptional()
  triggerConfig: Record<string, any> | null;

  @ApiProperty()
  isEnabled: boolean;

  @ApiProperty({ enum: ConditionLogic })
  conditionLogic: ConditionLogic;

  @ApiPropertyOptional()
  lastExecutedAt: Date | null;

  @ApiProperty()
  executionCount: number;

  @ApiPropertyOptional({
    description: 'Webhook token for webhook.incoming triggers',
  })
  webhookToken: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// Response DTO for automation rule with full details
export class AutomationRuleDetailDto extends AutomationRuleDto {
  @ApiProperty({ type: [ConditionDto] })
  conditions: ConditionDto[];

  @ApiProperty({ type: [ActionDto] })
  actions: ActionDto[];
}

// Pagination response
export class PaginatedAutomationRulesDto {
  @ApiProperty({ type: [AutomationRuleDto] })
  data: AutomationRuleDto[];

  @ApiProperty()
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
