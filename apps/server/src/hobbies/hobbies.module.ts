import { Module } from "@nestjs/common";

import { HobbiesController } from "./hobbies.controller";
import { HobbiesService } from "./hobbies.service";

@Module({
  controllers: [HobbiesController],
  providers: [HobbiesService],
})
export class HobbiesModule {}
