import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";

import { User } from "../auth/decorators/user.decorator";

import { LocationsService } from "./locations.service";

@ApiTags("위치/매칭")
@Controller("locations")
@UseGuards(AuthGuard("jwt"))
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get("nearby-users")
  @ApiOperation({ summary: "내 주변 공통 관심사 사용자 검색" })
  @ApiQuery({
    name: "radius",
    required: false,
    description: "검색 반경(미터 단위, 기본값 500m)",
  })
  findNearbyUsers(
    @User("id") userId: string,
    @Query("radius") radius?: string
  ) {
    const searchRadius = radius ? parseInt(radius, 10) : 500;
    return this.locationsService.findNearbyUsers(userId, searchRadius);
  }
}
