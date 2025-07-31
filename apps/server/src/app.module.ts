import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./core/database/prisma.module";
import { AuthModule } from "./auth/auth.module";
// import { UsersModule } from './users/users.module';
// import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    PrismaModule,

    AuthModule,
    // UsersModule, 유저 모듈
    // LocationsModule, 위치정보 모듈
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
