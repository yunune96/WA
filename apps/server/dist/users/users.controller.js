"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const user_decorator_1 = require("../auth/decorators/user.decorator");
const select_hobbies_dto_1 = require("./dto/select-hobbies.dto");
const update_location_dto_1 = require("./dto/update-location.dto");
const users_service_1 = require("./users.service");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    getMyProfile(user) {
        return this.usersService.findMyProfile(user.id);
    }
    async updateMyLocation(user, updateLocationDto) {
        return this.usersService.updateUserLocation(user.id, updateLocationDto.latitude, updateLocationDto.longitude);
    }
    selectMyHobbies(userId, selectHobbiesDto) {
        return this.usersService.selectHobbies(userId, selectHobbiesDto.hobbyIds);
    }
    initialSelectHobbies(authedUserId, userId, selectHobbiesDto) {
        if (authedUserId !== userId) {
            return { success: false, error: "권한이 없습니다." };
        }
        return this.usersService.selectHobbies(userId, selectHobbiesDto.hobbyIds);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)("me"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Patch)("me/location"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_location_dto_1.UpdateLocationDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMyLocation", null);
__decorate([
    (0, common_1.Post)("me/hobbies"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiOperation)({ summary: "내 관심사 선택/수정" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "관심사 저장 성공" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "인증되지 않음" }),
    __param(0, (0, user_decorator_1.User)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, select_hobbies_dto_1.SelectHobbiesDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "selectMyHobbies", null);
__decorate([
    (0, common_1.Post)(":userId/hobbies"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiOperation)({ summary: "회원가입 직후 최초 관심사 선택 (보호됨)" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "관심사 저장 성공" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "잘못된 요청 데이터" }),
    __param(0, (0, user_decorator_1.User)("id")),
    __param(1, (0, common_1.Param)("userId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, select_hobbies_dto_1.SelectHobbiesDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "initialSelectHobbies", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)("users"),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map