import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateHotspotDto {
  @IsString()
  flipbookId: string;

  @IsNumber()
  pageNumber: number;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsOptional()
  @IsString()
  productId?: string;
}
