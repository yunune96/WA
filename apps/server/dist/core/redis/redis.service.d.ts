import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private client;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<"OK">;
    setex(key: string, seconds: number, value: string): Promise<"OK">;
    del(key: string): Promise<number>;
    exists(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    sadd(key: string, ...members: string[]): Promise<number>;
    smembers(key: string): Promise<string[]>;
    onModuleDestroy(): Promise<void>;
}
