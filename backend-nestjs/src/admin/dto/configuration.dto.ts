import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateConfigurationValueDto {
  @ApiPropertyOptional({
    description:
      'New value for the configuration entry. Provide null to restore the default.',
    oneOf: [{ type: 'string' }, { type: 'boolean' }, { type: 'null' }],
  })
  @IsOptional()
  value?: string | boolean | null;
}
