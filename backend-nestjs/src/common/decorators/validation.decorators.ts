import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates that a user ID exists in the database
 */
export function IsUserExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUserExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // This would need to be implemented with actual database check
          // For now, just validate it's a positive number
          return typeof value === 'number' && value > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `User with ID ${args.value} does not exist`;
        },
      },
    });
  };
}

/**
 * Validates that an organisation ID exists in the database
 */
export function IsOrganisationExists(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isOrganisationExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // This would need to be implemented with actual database check
          // For now, just validate it's a positive number
          return typeof value === 'number' && value > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `Organisation with ID ${args.value} does not exist`;
        },
      },
    });
  };
}

/**
 * Validates that an array contains unique values
 */
export function IsUniqueArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!Array.isArray(value)) return false;
          return value.length === new Set(value).size;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain unique values`;
        },
      },
    });
  };
}

/**
 * Validates that a reservation calendar ID exists in the database
 */
export function IsReservationCalendarExists(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isReservationCalendarExists',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // This would need to be implemented with actual database check
          // For now, just validate it's a positive number
          return typeof value === 'number' && value > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `Reservation calendar with ID ${args.value} does not exist`;
        },
      },
    });
  };
}
