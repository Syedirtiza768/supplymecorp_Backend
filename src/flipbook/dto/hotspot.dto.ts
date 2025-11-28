import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HotspotDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsOptional()
  productSku?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  linkUrl?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  x: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  y: number;

  @IsNumber()
  @Min(0.1)
  @Max(100)
  @Type(() => Number)
  width: number;

  @IsNumber()
  @Min(0.1)
  @Max(100)
  @Type(() => Number)
  height: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  zIndex?: number;

  @IsOptional()
  meta?: any;
}
