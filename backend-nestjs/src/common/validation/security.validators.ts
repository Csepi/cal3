import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{10,128}$/;
const UNSAFE_TEXT_REGEX = /<\s*script|javascript:|data:text\/html/i;

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return (
            typeof value === 'string' && STRONG_PASSWORD_REGEX.test(value)
          );
        },
        defaultMessage(): string {
          return 'Password must include uppercase, lowercase, number, special character, and be 10-128 characters long.';
        },
      },
    });
  };
}

export function IsSafeText(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isSafeText',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (value === undefined || value === null) {
            return true;
          }
          return typeof value === 'string' && !UNSAFE_TEXT_REGEX.test(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} contains unsafe content.`;
        },
      },
    });
  };
}

export function IsAfterProperty(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isAfterProperty',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];

          if (!relatedValue || !value) {
            return true;
          }

          const left = new Date(relatedValue as string).getTime();
          const right = new Date(value as string).getTime();
          return Number.isFinite(left) && Number.isFinite(right) && right > left;
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be later than ${relatedPropertyName}.`;
        },
      },
    });
  };
}

