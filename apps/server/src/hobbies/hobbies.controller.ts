import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { HobbiesService } from "./hobbies.service";

@ApiTags("취미")
@Controller("hobbies")
export class HobbiesController {
  constructor(private readonly hobbiesService: HobbiesService) {}

  @Get()
  @ApiOperation({ summary: "모든 취미 목록 조회" })
  findAll() {
    return this.hobbiesService.findAll();
  }
}
