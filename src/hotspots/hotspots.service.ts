import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Hotspot } from "./hotspot.entity";
import { CreateHotspotDto } from "./dto/create-hotspot.dto";
import { UpdateHotspotDto } from "./dto/update-hotspot.dto";

@Injectable()
export class HotspotsService {
  constructor(
    @InjectRepository(Hotspot)
    private readonly hotspotRepo: Repository<Hotspot>
  ) {}

  findByFlipbookAndPage(flipbookId: string, pageNumber: number) {
    return this.hotspotRepo.find({
      where: { flipbookId, pageNumber },
      order: { x: "ASC" },
    });
  }

  async create(dto: CreateHotspotDto) {
    const hotspot = this.hotspotRepo.create(dto);
    return await this.hotspotRepo.save(hotspot);
  }

  async update(id: string, dto: UpdateHotspotDto) {
    await this.hotspotRepo.update(id, dto);
    return this.hotspotRepo.findOne({
      where: { id },
    });
  }

  async remove(id: string) {
    await this.hotspotRepo.delete(id);
    return { deleted: true };
  }
}
