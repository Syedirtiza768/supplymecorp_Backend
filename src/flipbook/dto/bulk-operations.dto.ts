import { IsArray, IsNumber, IsString, IsObject } from 'class-validator';

export class DeletePagesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  pageNumbers: number[];
}

export class BulkDeleteHotspotsDto {
  @IsArray()
  @IsString({ each: true })
  hotspotIds: string[];
}

export class BulkUpdateHotspotsDto {
  @IsArray()
  @IsString({ each: true })
  hotspotIds: string[];

  @IsObject()
  updates: {
    productSku?: string;
    label?: string;
    linkUrl?: string;
    zIndex?: number;
  };
}
