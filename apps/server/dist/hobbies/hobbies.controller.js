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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HobbiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const hobbies_service_1 = require("./hobbies.service");
let HobbiesController = class HobbiesController {
    constructor(hobbiesService) {
        this.hobbiesService = hobbiesService;
    }
    findAll() {
        return this.hobbiesService.findAll();
    }
};
exports.HobbiesController = HobbiesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "모든 취미 목록 조회" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HobbiesController.prototype, "findAll", null);
exports.HobbiesController = HobbiesController = __decorate([
    (0, swagger_1.ApiTags)("취미"),
    (0, common_1.Controller)("hobbies"),
    __metadata("design:paramtypes", [hobbies_service_1.HobbiesService])
], HobbiesController);
//# sourceMappingURL=hobbies.controller.js.map