import {
  Injectable,
  PipeTransform,
  HttpException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { IsDateString, IsNotEmpty } from 'class-validator';
import { validateSync } from 'class-validator';

export class PublicBookingAvailabilityQueryDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string;
}

@Injectable()
export class PublicBookingValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    if ('date' in value) {
      const dto = plainToInstance(PublicBookingAvailabilityQueryDto, value);
      const errors = validateSync(dto, {
        whitelist: true,
        forbidNonWhitelisted: false,
      });

      if (errors.length > 0) {
        const message = 'Date parameter is required (format: YYYY-MM-DD)';
        throw new HttpException({ error: message }, 200);
      }

      return dto;
    }

    return value;
  }
}
