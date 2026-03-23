import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  ValidateIf,
  MaxLength,
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsNumber,
  IsIn,
  IsInt,
  IsObject,
  Min,
  Max,
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

const RELATIVE_REFERENCE_BASES = ['start', 'end'] as const;
const RELATIVE_OFFSET_DIRECTIONS = ['before', 'after'] as const;
const RELATIVE_OFFSET_UNITS = ['minutes', 'hours', 'days', 'weeks'] as const;
const RELATIVE_TRIGGER_CONFIG_KEYS = [
  'configVersion',
  'eventFilter',
  'referenceTime',
  'offset',
  'execution',
] as const;

const isRelativeShapeCandidate = (value: unknown): boolean => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return RELATIVE_TRIGGER_CONFIG_KEYS.some((key) => record[key] !== undefined);
};

const shouldValidateRelativeTriggerConfig = (
  triggerType: TriggerType | undefined,
  triggerConfig: unknown,
): boolean =>
  triggerType === TriggerType.RELATIVE_TIME_TO_EVENT ||
  isRelativeShapeCandidate(triggerConfig);

export class RelativeTimeToEventFilterDto {
  @ApiPropertyOptional({
    type: [Number],
    description: 'Filter events by calendar IDs',
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  calendarIds?: number[];

  @ApiPropertyOptional({
    type: [Number],
    description: 'Alias for calendarIds',
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  calendars?: number[];

  @ApiPropertyOptional({
    description: 'Event title contains substring',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleContains?: string;

  @ApiPropertyOptional({
    description: 'Event description contains substring',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descriptionContains?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Event tag filters',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Alias for tags',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  labels?: string[];

  @ApiPropertyOptional({ description: 'Match only all-day events' })
  @IsOptional()
  @IsBoolean()
  isAllDayOnly?: boolean;

  @ApiPropertyOptional({ description: 'Match only recurring events' })
  @IsOptional()
  @IsBoolean()
  isRecurringOnly?: boolean;
}

export class RelativeTimeToEventReferenceTimeDto {
  @ApiPropertyOptional({
    enum: RELATIVE_REFERENCE_BASES,
    description: 'Reference base timestamp',
  })
  @IsOptional()
  @IsIn(RELATIVE_REFERENCE_BASES)
  base?: (typeof RELATIVE_REFERENCE_BASES)[number];
}

export class RelativeTimeToEventOffsetDto {
  @ApiPropertyOptional({
    enum: RELATIVE_OFFSET_DIRECTIONS,
    description: 'Offset direction relative to reference time',
  })
  @IsOptional()
  @IsIn(RELATIVE_OFFSET_DIRECTIONS)
  direction?: (typeof RELATIVE_OFFSET_DIRECTIONS)[number];

  @ApiPropertyOptional({
    description: 'Offset amount (must be >= 0)',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({
    enum: RELATIVE_OFFSET_UNITS,
    description: 'Offset unit',
  })
  @IsOptional()
  @IsIn(RELATIVE_OFFSET_UNITS)
  unit?: (typeof RELATIVE_OFFSET_UNITS)[number];
}

export class RelativeTimeToEventExecutionDto {
  @ApiPropertyOptional({
    description: 'Only execute once for the same event occurrence',
  })
  @IsOptional()
  @IsBoolean()
  runOncePerEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Execute for each recurring occurrence',
  })
  @IsOptional()
  @IsBoolean()
  fireForEveryOccurrenceOfRecurringEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Skip firing for past-due schedules',
  })
  @IsOptional()
  @IsBoolean()
  skipPast?: boolean;

  @ApiPropertyOptional({
    description: 'Allowed grace period for past-due jobs in minutes',
    minimum: 0,
    maximum: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  pastDueGraceMinutes?: number;

  @ApiPropertyOptional({
    description: 'Forward scheduling window in days',
    minimum: 1,
    maximum: 730,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(730)
  schedulingWindowDays?: number;
}

export class RelativeTimeToEventTriggerConfigDto {
  @ApiPropertyOptional({
    description: 'Relative trigger config schema version',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  configVersion?: number;

  @ApiPropertyOptional({
    type: RelativeTimeToEventFilterDto,
    description: 'Event filter for relative trigger matching',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RelativeTimeToEventFilterDto)
  eventFilter?: RelativeTimeToEventFilterDto;

  @ApiPropertyOptional({
    type: RelativeTimeToEventReferenceTimeDto,
    description: 'Reference timestamp selector',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RelativeTimeToEventReferenceTimeDto)
  referenceTime?: RelativeTimeToEventReferenceTimeDto;

  @ApiPropertyOptional({
    type: RelativeTimeToEventOffsetDto,
    description: 'Relative offset definition',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RelativeTimeToEventOffsetDto)
  offset?: RelativeTimeToEventOffsetDto;

  @ApiPropertyOptional({
    type: RelativeTimeToEventExecutionDto,
    description: 'Execution settings',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RelativeTimeToEventExecutionDto)
  execution?: RelativeTimeToEventExecutionDto;
}

// DTO for creating a condition
export class CreateConditionDto {
  @ApiProperty({ enum: ConditionField, description: 'Event field to check' })
  @IsEnum(ConditionField)
  field!: ConditionField;

  @ApiProperty({ enum: ConditionOperator, description: 'Comparison operator' })
  @IsEnum(ConditionOperator)
  operator!: ConditionOperator;

  @ApiProperty({
    description: 'Expected value (stored as string)',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  value!: string;

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
  logicOperator!: ConditionLogicOperator;

  @ApiPropertyOptional({ description: 'Evaluation order', default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

// DTO for creating an action
export class CreateActionDto {
  @ApiProperty({ enum: ActionType, description: 'Type of action to execute' })
  @IsEnum(ActionType)
  actionType!: ActionType;

  @ApiProperty({
    description: 'Action-specific configuration (JSON)',
    example: { color: '#3b82f6' },
  })
  @IsOptional()
  actionConfig!: Record<string, unknown>;

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
  name!: string;

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
  triggerType!: TriggerType;

  @ApiPropertyOptional({
    description: 'Trigger-specific configuration (JSON)',
    example: { minutes: 30 },
  })
  @IsOptional()
  @ValidateIf((dto: CreateAutomationRuleDto) =>
    shouldValidateRelativeTriggerConfig(dto.triggerType, dto.triggerConfig),
  )
  @IsObject()
  @ValidateNested()
  @Type(() => RelativeTimeToEventTriggerConfigDto)
  triggerConfig?: Record<string, unknown>;

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
  actions!: CreateActionDto[];
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
  @ValidateIf((dto: UpdateAutomationRuleDto) =>
    shouldValidateRelativeTriggerConfig(undefined, dto.triggerConfig),
  )
  @IsObject()
  @ValidateNested()
  @Type(() => RelativeTimeToEventTriggerConfigDto)
  triggerConfig?: Record<string, unknown>;

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
  id!: number;

  @ApiProperty({ enum: ConditionField })
  field!: ConditionField;

  @ApiProperty({ enum: ConditionOperator })
  operator!: ConditionOperator;

  @ApiProperty()
  value!: string;

  @ApiPropertyOptional()
  groupId!: string | null;

  @ApiProperty({ enum: ConditionLogicOperator })
  logicOperator!: ConditionLogicOperator;

  @ApiProperty()
  order!: number;
}

// Response DTO for action
export class ActionDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: ActionType })
  actionType!: ActionType;

  @ApiProperty()
  actionConfig!: Record<string, unknown>;

  @ApiProperty()
  order!: number;
}

// Response DTO for automation rule (summary)
export class AutomationRuleDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description!: string | null;

  @ApiProperty({ enum: TriggerType })
  triggerType!: TriggerType;

  @ApiPropertyOptional()
  triggerConfig!: Record<string, unknown> | null;

  @ApiProperty()
  isEnabled!: boolean;

  @ApiProperty({ enum: ConditionLogic })
  conditionLogic!: ConditionLogic;

  @ApiPropertyOptional()
  lastExecutedAt!: Date | null;

  @ApiProperty()
  executionCount!: number;

  @ApiPropertyOptional({
    description: 'Webhook token for webhook.incoming triggers',
  })
  webhookToken!: string | null;

  @ApiProperty({
    description:
      'Whether this rule requires explicit approval before execution',
    default: false,
  })
  isApprovalRequired!: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when approval was granted',
  })
  approvedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

// Response DTO for automation rule with full details
export class AutomationRuleDetailDto extends AutomationRuleDto {
  @ApiProperty({ type: [ConditionDto] })
  conditions!: ConditionDto[];

  @ApiProperty({ type: [ActionDto] })
  actions!: ActionDto[];
}

// Pagination response
export class PaginatedAutomationRulesDto {
  @ApiProperty({ type: [AutomationRuleDto] })
  data!: AutomationRuleDto[];

  @ApiProperty()
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
