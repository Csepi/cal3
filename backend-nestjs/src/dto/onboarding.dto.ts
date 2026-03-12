import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { SanitizeText } from '../common/validation/sanitize.decorator';
import { IsSafeText } from '../common/validation/security.validators';

export enum OnboardingLanguage {
  EN = 'en',
  DE = 'de',
  FR = 'fr',
  HU = 'hu',
}

export enum CalendarUseCase {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  TEAM = 'team',
  OTHER = 'other',
}

const ONBOARDING_TIME_FORMATS = ['12h', '24h'] as const;
const ONBOARDING_CALENDAR_VIEWS = ['month', 'week'] as const;

const isIanaTimezone = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

function IsIanaTimezone(validationOptions?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isIanaTimezone',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return isIanaTimezone(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid IANA timezone string.`;
        },
      },
    });
  };
}

export class CompleteOnboardingDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(80)
  @IsSafeText()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(80)
  @IsSafeText()
  lastName?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/avatar.jpg',
    description: 'Optional profile picture URL',
  })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(2048)
  @IsUrl({ require_tld: false })
  profilePictureUrl?: string;

  @ApiProperty({ enum: OnboardingLanguage, example: OnboardingLanguage.EN })
  @IsEnum(OnboardingLanguage)
  language!: OnboardingLanguage;

  @ApiProperty({ example: 'Europe/Budapest' })
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(100)
  @IsIanaTimezone()
  timezone!: string;

  @ApiProperty({ example: '24h', enum: ONBOARDING_TIME_FORMATS })
  @IsIn(ONBOARDING_TIME_FORMATS)
  timeFormat!: (typeof ONBOARDING_TIME_FORMATS)[number];

  @ApiProperty({ example: 1, description: '0=Sunday ... 6=Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  weekStartDay!: number;

  @ApiProperty({ example: 'month', enum: ONBOARDING_CALENDAR_VIEWS })
  @IsIn(ONBOARDING_CALENDAR_VIEWS)
  defaultCalendarView!: (typeof ONBOARDING_CALENDAR_VIEWS)[number];

  @ApiProperty({ example: '#3b82f6' })
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'themeColor must be a valid hex color.',
  })
  themeColor!: string;

  @ApiProperty({
    example: true,
    description: 'Must be true to complete onboarding.',
  })
  @IsBoolean()
  @Equals(true, { message: 'privacyPolicyAccepted must be true.' })
  privacyPolicyAccepted!: boolean;

  @ApiProperty({
    example: true,
    description: 'Must be true to complete onboarding.',
  })
  @IsBoolean()
  @Equals(true, { message: 'termsOfServiceAccepted must be true.' })
  termsOfServiceAccepted!: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  productUpdatesEmailConsent?: boolean;

  @ApiPropertyOptional({ example: 'v1.0' })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(64)
  privacyPolicyVersion?: string;

  @ApiPropertyOptional({ example: 'v1.0' })
  @IsOptional()
  @SanitizeText({ trim: true })
  @IsString()
  @MaxLength(64)
  termsOfServiceVersion?: string;

  @ApiPropertyOptional({ enum: CalendarUseCase, example: CalendarUseCase.PERSONAL })
  @IsOptional()
  @IsEnum(CalendarUseCase)
  calendarUseCase?: CalendarUseCase;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  setupGoogleCalendarSync?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  setupMicrosoftCalendarSync?: boolean;
}
