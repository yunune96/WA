import { PartialType } from "@nestjs/mapped-types";

import { RegisterUserDto } from "./register-user.dto";

export class UpdateAuthDto extends PartialType(RegisterUserDto) {}

// 내 정보 수정시 인증용 dto
