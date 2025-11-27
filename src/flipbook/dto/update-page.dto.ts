import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
