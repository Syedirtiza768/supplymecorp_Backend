import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UploadPageDto {
  @IsString()
  @IsNotEmpty()
  flipbookId: string;

  @IsOptional()
  @IsString()
  pageNumber?: string; // Optional, will auto-assign if not provided
}
