import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export type InboxRuleScope =
  | 'global'
  | 'organisation'
  | 'calendar'
  | 'reservation';

export class InboxRuleConditionDto {
  @IsString()
  field!: string;

  @IsString()
  operator!: string;

  @IsOptional()
  value?: string | number | boolean | Record<string, any> | null;
}

export class InboxRuleActionDto {
  @IsString()
  type!: string;

  @IsOptional()
  payload?: Record<string, any> | null;
}

export class InboxRuleDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  name!: string;

  @IsEnum(['global', 'organisation', 'calendar', 'reservation'])
  scopeType!: InboxRuleScope;

  @IsOptional()
  scopeId?: string | number | null;

  @IsBoolean()
  isEnabled!: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InboxRuleConditionDto)
  conditions!: InboxRuleConditionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InboxRuleActionDto)
  actions!: InboxRuleActionDto[];

  @IsOptional()
  @IsBoolean()
  continueProcessing?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateInboxRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InboxRuleDto)
  rules!: InboxRuleDto[];
}
