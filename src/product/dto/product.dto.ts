import { IsOptional, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeDto {
  @IsString()
  name: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  uom?: string;
}

export class NumericAttributeDto {
  @IsString()
  name: string;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  uom?: number;
}

export class CreateProductDto {
  @IsOptional()
  @IsNumber()
  categoryCode?: number;

  @IsOptional()
  @IsString()
  upcCode?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  modelNumber?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  categoryTitleDescription?: string;

  @IsOptional()
  @IsString()
  onlineTitleDescription?: string;

  @IsOptional()
  @IsString()
  onlineLongDescription?: string;

  // Feature bullets
  @IsOptional()
  @IsString()
  onlineFeatureBullet1?: string;

  @IsOptional()
  @IsString()
  onlineFeatureBullet2?: string;

  // Add more fields as needed

  // Attributes
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  textAttributes?: AttributeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NumericAttributeDto)
  numericAttributes?: NumericAttributeDto[];
}

export class UpdateProductDto extends CreateProductDto {}