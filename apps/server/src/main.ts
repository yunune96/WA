import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const frontendUrl = configService.get<string>("FRONTEND_URL");
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
  app.use(helmet());
  app.use(cookieParser());

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("WithoutAlone API")
      .setDescription("WithoutAlone")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api-docs", app, document);
  }

  const port = configService.get<number>("PORT", 3001);
  await app.listen(port);

  console.log(`🚀 Server is running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`📚 API-Docs is running on: http://localhost:${port}/api-docs`);
  }
}

bootstrap();
