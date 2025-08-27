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
exports.LocationsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const user_decorator_1 = require("../auth/decorators/user.decorator");
const locations_service_1 = require("./locations.service");
let LocationsController = class LocationsController {
    constructor(locationsService) {
        this.locationsService = locationsService;
    }
    findNearbyUsers(userId, radius) {
        const searchRadius = radius ? parseInt(radius, 10) : 500;
        return this.locationsService.findNearbyUsers(userId, searchRadius);
    }
};
exports.LocationsController = LocationsController;
__decorate([
    (0, common_1.Get)("nearby-users"),
    (0, swagger_1.ApiOperation)({ summary: "내 주변 공통 관심사 사용자 검색" }),
    (0, swagger_1.ApiQuery)({
        name: "radius",
        required: false,
        description: "검색 반경(미터 단위, 기본값 500m)",
    }),
    __param(0, (0, user_decorator_1.User)("id")),
    __param(1, (0, common_1.Query)("radius")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "findNearbyUsers", null);
exports.LocationsController = LocationsController = __decorate([
    (0, swagger_1.ApiTags)("위치/매칭"),
    (0, common_1.Controller)("locations"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [locations_service_1.LocationsService])
], LocationsController);
//# sourceMappingURL=locations.controller.js.map