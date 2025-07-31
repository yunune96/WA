import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
  });

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

  const port = configService.get<number>("PORT") || 3001;
  await app.listen(port);

  console.log(`🚀 Server is running on: http://localhost:${port}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`📚 API-Docs is running on: http://localhost:${port}/api-docs`);
  }
}

bootstrap();
