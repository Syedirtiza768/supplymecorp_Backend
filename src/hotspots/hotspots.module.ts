import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Hotspot } from "./hotspot.entity";
import { HotspotsService } from "./hotspots.service";
import { HotspotsController } from "./hotspots.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Hotspot])],
  controllers: [HotspotsController],
  providers: [HotspotsService],
  exports: [HotspotsService],
})
export class HotspotsModule {}
