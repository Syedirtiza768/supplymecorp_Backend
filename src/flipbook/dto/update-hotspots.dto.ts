import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { HotspotDto } from './hotspot.dto';

export class UpdateHotspotsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HotspotDto)
  hotspots: HotspotDto[];
}
