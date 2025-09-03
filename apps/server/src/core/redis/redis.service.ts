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
    const host = this.configService.get<string>("REDIS_HOST", "localhost");
    const port = this.configService.get<number>("REDIS_PORT", 6379);
    const password = this.configService.get<string>("REDIS_PASSWORD");
    const tlsFlag = this.configService.get<string>("REDIS_TLS");
    const useTls = tlsFlag === "true" || tlsFlag === "1";

    const redisOptions: RedisOptions = {
      host,
      port,
      password,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      // TLS가 필요한 환경(예: ElastiCache Serverless)은 REDIS_TLS=true 로 설정하세요.
      // servername 지정은 SNI를 위해 필요합니다.
      tls: useTls ? { servername: host } : undefined,
      connectTimeout: 5000,
      commandTimeout: 5000,

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

    this.client.on("ready", () => {
      this.logger.log("Redis 클라이언트 ready 상태");
    });

    this.client.on("end", () => {
      this.logger.warn("Redis 연결이 종료되었습니다.");
    });

    this.client.on("reconnecting", (delay: number) => {
      this.logger.warn(`Redis 재연결 시도 중... ${delay}ms 후 재시도`);
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
