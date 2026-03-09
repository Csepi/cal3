import { IsDateString, IsOptional } from 'class-validator';

export class ListEventsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

