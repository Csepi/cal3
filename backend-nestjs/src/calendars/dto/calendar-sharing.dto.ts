import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class UnshareCalendarUsersDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  userIds!: number[];
}

