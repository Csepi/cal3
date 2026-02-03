import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';
import { ERROR_CODES } from '../responses/error.catalog';

/**
 * Structured validation error detail.
 */
export interface ValidationErrorDetail {
  /**
   * Dot-notated field name for the validation error.
   */
  field: string;
  /**
   * Human-readable reasons explaining validation failures.
   */
  reasons: string[];
  /**
   * The rejected value if available.
   */
  value?: any;
}

/**
 * Flatten nested validation errors into a list of field-level details.
 */
const flattenValidationErrors = (
  errors: ValidationError[],
  parentPath = '',
): ValidationErrorDetail[] => {
  const details: ValidationErrorDetail[] = [];

  errors.forEach((error) => {
    const fieldPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      details.push({
        field: fieldPath,
        reasons: Object.values(error.constraints),
        value: error.value,
      });
    }

    if (error.children && error.children.length > 0) {
      details.push(...flattenValidationErrors(error.children, fieldPath));
    }
  });

  return details;
};

/**
 * Build a ValidationPipe instance that emits standardized error responses.
 */
export const createApiValidationPipe = (
  overrides: ValidationPipeOptions = {},
): ValidationPipe => {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
    forbidUnknownValues: true,
    enableDebugMessages: process.env.NODE_ENV !== 'production',
    transformOptions: { enableImplicitConversion: true },
    ...overrides,
    exceptionFactory: (errors: ValidationError[]) => {
      const details = flattenValidationErrors(errors);
      return new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Validation failed',
        details: { fields: details },
      });
    },
  });
};
