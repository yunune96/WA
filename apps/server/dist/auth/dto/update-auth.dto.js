"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAuthDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const register_user_dto_1 = require("./register-user.dto");
class UpdateAuthDto extends (0, mapped_types_1.PartialType)(register_user_dto_1.RegisterUserDto) {
}
exports.UpdateAuthDto = UpdateAuthDto;
// 내 정보 수정시 인증용 dto
//# sourceMappingURL=update-auth.dto.js.map