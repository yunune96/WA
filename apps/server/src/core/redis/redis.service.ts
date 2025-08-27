import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis, { RedisOptions } from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisOptions: RedisOptions = {
      host: this.configService.get<string>("REDIS_HOST", "localhost"),
      port: this.configService.get<number>("REDIS_PORT", 6379),
      password: this.configService.get<string>("REDIS_PASSWORD"),
      maxRetriesPerRequest: 3,

      retryStrategy: (times: number): number | null => {
        if (times > 10) {
          this.logger.error("Redis 재연결 시도 횟수 초과. 연결을 중단합니다.");
          return null;
        }
        const delay = Math.min(times * 100, 3000);
        this.logger.warn(
          `Redis 연결이 끊겼습니다. ${delay}ms 후 ${times}번째 재연결을 시도합니다.`
        );
        return delay;
      },
    };

    this.client = new Redis(redisOptions);

    this.client.on("error", (error) => {
      this.logger.error("Redis 연결 에러:", error);
    });

    this.client.on("connect", () => {
      this.logger.log("Redis 연결 성공");
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string): Promise<"OK"> {
    return await this.client.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<"OK"> {
    return await this.client.setex(key, seconds, value);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.client.expire(key, seconds);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return await this.client.sadd(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log("Redis 연결을 정상적으로 종료했습니다.");
  }
}
