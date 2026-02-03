import {
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditLogStatus } from '../../entities/automation-audit-log.entity';

// Query DTO for filtering audit logs
export class AuditLogQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by execution status',
    enum: AuditLogStatus,
  })
  @IsOptional()
  @IsEnum(AuditLogStatus)
  status?: AuditLogStatus;

  @ApiPropertyOptional({
    description: 'Filter logs from this date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter logs until this date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Results per page',
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

// Response DTO for condition evaluation result
export class ConditionEvaluationDto {
  @ApiProperty({ description: 'Condition ID' })
  conditionId!: number;

  @ApiProperty({ description: 'Field being evaluated' })
  field!: string;

  @ApiProperty({ description: 'Operator used' })
  operator!: string;

  @ApiProperty({ description: 'Expected value' })
  expectedValue!: string;

  @ApiProperty({ description: 'Actual value from event' })
  actualValue!: any;

  @ApiProperty({ description: 'Whether condition passed' })
  passed!: boolean;

  @ApiPropertyOptional({ description: 'Error message if evaluation failed' })
  error?: string;
}

// Response DTO for conditions result
export class ConditionsResultDto {
  @ApiProperty({ description: 'Overall conditions passed' })
  passed!: boolean;

  @ApiProperty({
    description: 'Individual condition evaluations',
    type: [ConditionEvaluationDto],
  })
  evaluations!: ConditionEvaluationDto[];

  @ApiPropertyOptional({ description: 'Logic expression evaluated' })
  logicExpression?: string;
}

// Response DTO for action execution result
export class ActionResultDto {
  @ApiProperty({ description: 'Action ID' })
  actionId!: number;

  @ApiProperty({ description: 'Action type executed' })
  actionType!: string;

  @ApiProperty({ description: 'Whether action succeeded' })
  success!: boolean;

  @ApiPropertyOptional({ description: 'Error message if action failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Additional result data' })
  data?: Record<string, unknown>;

  @ApiProperty({ description: 'Action execution timestamp' })
  executedAt!: Date;
}

// Response DTO for audit log entry (summary)
export class AuditLogDto {
  @ApiProperty({ description: 'Audit log entry ID' })
  id!: number;

  @ApiProperty({ description: 'Rule ID that was executed' })
  ruleId!: number;

  @ApiPropertyOptional({
    description: 'Rule name (included when loading list)',
  })
  ruleName?: string;

  @ApiProperty({ description: 'Event ID that triggered the rule' })
  eventId!: number;

  @ApiPropertyOptional({
    description: 'Event title (included when loading list)',
  })
  eventTitle?: string;

  @ApiProperty({ description: 'Execution status', enum: AuditLogStatus })
  status!: AuditLogStatus;

  @ApiProperty({ description: 'Conditions evaluation result' })
  conditionsResult!: ConditionsResultDto;

  @ApiPropertyOptional({
    description: 'Action execution results',
    type: [ActionResultDto],
  })
  actionResults?: ActionResultDto[];

  @ApiPropertyOptional({ description: 'Trigger type that started execution' })
  triggerType?: string;

  @ApiPropertyOptional({
    description: 'User ID who executed (for manual runs)',
  })
  executedByUserId?: number;

  @ApiProperty({ description: 'Execution timestamp' })
  executedAt!: Date;

  @ApiProperty({ description: 'Total execution time in milliseconds' })
  executionTimeMs!: number;
}

// Response DTO for detailed audit log with related entities
export class AuditLogDetailDto extends AuditLogDto {
  @ApiProperty({ description: 'Rule details' })
  rule!: {
    id: number;
    name: string;
    triggerType: string;
  };

  @ApiProperty({ description: 'Event details' })
  event!: {
    id: number;
    title: string;
    startTime: string | null;
    endTime: string | null;
  };

  @ApiPropertyOptional({ description: 'User who executed (for manual runs)' })
  executedBy?: {
    id: number;
    email: string;
  };
}

// Paginated response for audit logs
export class PaginatedAuditLogsDto {
  @ApiProperty({ description: 'Audit log entries', type: [AuditLogDto] })
  data!: AuditLogDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Statistics DTO for audit logs
export class AuditLogStatsDto {
  @ApiProperty({ description: 'Total executions' })
  totalExecutions!: number;

  @ApiProperty({ description: 'Successful executions' })
  successCount!: number;

  @ApiProperty({ description: 'Failed executions' })
  failureCount!: number;

  @ApiProperty({ description: 'Skipped executions (conditions not met)' })
  skippedCount!: number;

  @ApiProperty({ description: 'Partial success executions' })
  partialSuccessCount!: number;

  @ApiProperty({ description: 'Average execution time in milliseconds' })
  avgExecutionTimeMs!: number;

  @ApiProperty({ description: 'Last execution timestamp' })
  lastExecutedAt!: Date | null;
}
