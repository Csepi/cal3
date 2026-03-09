import { IsObject, IsOptional } from 'class-validator';

export class AgentStreamPayloadDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

