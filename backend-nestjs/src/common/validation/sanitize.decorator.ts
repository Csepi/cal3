import { Transform } from 'class-transformer';
import { sanitizeTextInput } from './input-sanitizer';

export interface SanitizeTextOptions {
  trim?: boolean;
  toLowerCase?: boolean;
  maxLength?: number;
}

export function SanitizeText(options: SanitizeTextOptions = {}): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    let next = sanitizeTextInput(value);
    if (options.trim) {
      next = next.trim();
    }
    if (options.toLowerCase) {
      next = next.toLowerCase();
    }
    if (typeof options.maxLength === 'number' && options.maxLength > 0) {
      next = next.slice(0, options.maxLength);
    }
    return next;
  });
}

