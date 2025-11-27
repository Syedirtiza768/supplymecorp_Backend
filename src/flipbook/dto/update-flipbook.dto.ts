import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateFlipbookDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
