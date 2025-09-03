import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Patch,
  Body,
  Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { User as UserEntity } from "@prisma/client";

import { User } from "../auth/decorators/user.decorator";

import { SelectHobbiesDto } from "./dto/select-hobbies.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { UpdatePasswordDto } from "./dto/update-password.dto";
import { UpdateUsernameDto } from "./dto/update-username.dto";
import { UsersService } from "./users.service";
type SafeUser = Omit<UserEntity, "password">;

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  private readonly logger = new Logger(UsersController.name);

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  getMyProfile(@User() user: SafeUser) {
    return this.usersService.findMyProfile(user.id);
  }

  @Patch("me/location")
  @UseGuards(AuthGuard("jwt"))
  async updateMyLocation(
    @User() user: SafeUser,
    @Body() updateLocationDto: UpdateLocationDto
  ) {
    this.logger.log(
      `PATCH /users/me/location start user=${user.id} lat=${updateLocationDto.latitude} lon=${updateLocationDto.longitude}`
    );
    return this.usersService.updateUserLocation(
      user.id,
      updateLocationDto.latitude,
      updateLocationDto.longitude
    );
  }

  @Post("me/hobbies")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "내 관심사 선택/수정" })
  @ApiResponse({ status: 200, description: "관심사 저장 성공" })
  @ApiResponse({ status: 401, description: "인증되지 않음" })
  selectMyHobbies(
    @User("id") userId: string,
    @Body() selectHobbiesDto: SelectHobbiesDto
  ) {
    return this.usersService.selectHobbies(userId, selectHobbiesDto.hobbyIds);
  }

  @Patch("me/username")
  @UseGuards(AuthGuard("jwt"))
  updateMyUsername(
    @User("id") userId: string,
    @Body() dto: UpdateUsernameDto
  ) {
    return this.usersService.updateUsername(userId, dto.username);
  }

  @Patch("me/password")
  @UseGuards(AuthGuard("jwt"))
  updateMyPassword(
    @User("id") userId: string,
    @Body() dto: UpdatePasswordDto
  ) {
    return this.usersService.updatePassword(
      userId,
      dto.oldPassword,
      dto.newPassword
    );
  }

  @Post(":userId/hobbies")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "회원가입 직후 최초 관심사 선택 (보호됨)" })
  @ApiResponse({ status: 201, description: "관심사 저장 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청 데이터" })
  initialSelectHobbies(
    @User("id") authedUserId: string,
    @Param("userId") userId: string,
    @Body() selectHobbiesDto: SelectHobbiesDto
  ) {
    if (authedUserId !== userId) {
      return { success: false, error: "권한이 없습니다." };
    }
    return this.usersService.selectHobbies(userId, selectHobbiesDto.hobbyIds);
  }

  @Post("public")
  @UseGuards(AuthGuard("jwt"))
  @ApiOperation({ summary: "특정 사용자들의 공개 정보 조회 (보호됨)" })
  async getPublicUsers(
    @User("id") authedUserId: string,
    @Body() body: { ids: string[] }
  ) {
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) return [];
    const users = await this.usersService.getPublicUsers(ids, authedUserId);
    return users;
  }
}
