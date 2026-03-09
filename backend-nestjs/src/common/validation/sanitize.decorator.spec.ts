import { plainToInstance } from 'class-transformer';
import { SanitizeText } from './sanitize.decorator';

class DecoratorProbeDto {
  @SanitizeText({ trim: true, toLowerCase: true, maxLength: 6 })
  value!: string;
}

describe('SanitizeText decorator', () => {
  it('sanitizes, trims, lowercases, and truncates text values', () => {
    const dto = plainToInstance(DecoratorProbeDto, {
      value: '  AB\u0000CD1234  ',
    });

    expect(dto.value).toBe('abcd12');
  });

  it('leaves non-string values untouched', () => {
    const dto = plainToInstance(DecoratorProbeDto, {
      value: 1234 as unknown as string,
    });

    expect(dto.value).toBe(1234 as unknown as string);
  });
});
