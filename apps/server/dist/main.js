"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const frontendUrl = configService.get("FRONTEND_URL");
    app.enableCors({
        origin: frontendUrl || true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
        ],
    });
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    if (process.env.NODE_ENV !== "production") {
        const config = new swagger_1.DocumentBuilder()
            .setTitle("WithoutAlone API")
            .setDescription("WithoutAlone")
            .setVersion("1.0")
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup("api-docs", app, document);
    }
    const port = configService.get("PORT", 3001);
    await app.listen(port);
    console.log(`🚀 Server is running on: http://localhost:${port}`);
    if (process.env.NODE_ENV !== "production") {
        console.log(`📚 API-Docs is running on: http://localhost:${port}/api-docs`);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map