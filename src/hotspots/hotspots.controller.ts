import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
} from "@nestjs/common";
import { HotspotsService } from "./hotspots.service";
import { CreateHotspotDto } from "./dto/create-hotspot.dto";
import { UpdateHotspotDto } from "./dto/update-hotspot.dto";

@Controller("hotspots")
export class HotspotsController {
  constructor(private readonly hotspotsService: HotspotsService) {}

  @Get()
  findByFlipbookAndPage(
    @Query("flipbookId") flipbookId: string,
    @Query("pageNumber") pageNumber: string
  ) {
    return this.hotspotsService.findByFlipbookAndPage(
      flipbookId,
      Number(pageNumber)
    );
  }

  @Post()
  create(@Body() dto: CreateHotspotDto) {
    return this.hotspotsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateHotspotDto) {
    return this.hotspotsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.hotspotsService.remove(id);
  }
}
