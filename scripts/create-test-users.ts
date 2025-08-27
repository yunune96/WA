/*
  test user 생성 스크립트
  현재 사용자 기준 500m 1000m 2000m 더미데이터 생성
  Usage:
    - npm run seed:test-users
    - Optionally override base coordinate via environment variables:
      TEST_BASE_LAT=37.5665 TEST_BASE_LON=126.9780 npm run seed:test-users
*/
import "dotenv/config";
// removed JWT token generation utilities

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import Redis from "ioredis";

const prisma = new PrismaClient();

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Compute destination point given start lat/lon, distance (meters), and bearing (degrees)
function projectPoint(
  latitude: number,
  longitude: number,
  distanceMeters: number,
  bearingDegrees: number
): { latitude: number; longitude: number } {
  const R = 6371_000; // Earth radius in meters
  const δ = distanceMeters / R; // angular distance in radians
  const θ = toRadians(bearingDegrees);

  const φ1 = toRadians(latitude);
  const λ1 = toRadians(longitude);

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinδ = Math.sin(δ);
  const cosδ = Math.cos(δ);
  const sinθ = Math.sin(θ);
  const cosθ = Math.cos(θ);

  const sinφ2 = sinφ1 * cosδ + cosφ1 * sinδ * cosθ;
  const φ2 = Math.asin(sinφ2);
  const y = sinθ * sinδ * cosφ1;
  const x = cosδ - sinφ1 * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return {
    latitude: toDegrees(φ2),
    longitude: ((toDegrees(λ2) + 540) % 360) - 180,
  };
}

async function getRedis(): Promise<Redis> {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    return new Redis(redisUrl);
  }
  const host = process.env.REDIS_HOST ?? "localhost";
  const port = Number(process.env.REDIS_PORT ?? 6379);
  const password = process.env.REDIS_PASSWORD ?? undefined;
  return new Redis({ host, port, password });
}

async function getFirstNHobbyIds(n: number): Promise<number[]> {
  const rows = await prisma.hobby.findMany({
    orderBy: { id: "asc" },
    take: n,
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function upsertUser(
  email: string,
  username: string,
  passwordPlain: string
): Promise<{ id: string }> {
  const hashed = await bcrypt.hash(passwordPlain, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashed, username },
      select: { id: true },
    });
    return updated;
  }
  const created = await prisma.user.create({
    data: { email, password: hashed, username },
    select: { id: true },
  });
  return created;
}

async function upsertLocation(
  userId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  await prisma.user_Location.upsert({
    where: { userId },
    update: { latitude, longitude, updatedAt: new Date() },
    create: { userId, latitude, longitude },
  });
}

async function attachHobby(userId: string, hobbyId: number): Promise<void> {
  await prisma.user_Hobbies.upsert({
    where: { userId_hobbyId: { userId, hobbyId } },
    update: {},
    create: { userId, hobbyId },
  });
}

async function updateRedisGeo(
  redis: Redis,
  userId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  await redis.geoadd("user_locations", longitude, latitude, userId);
  await redis.zadd("user_last_seen", Date.now().toString(), userId);
}

async function main(): Promise<void> {
  const BASE_LAT = Number(process.env.TEST_BASE_LAT ?? 37.5); // default: Seoul approx
  const BASE_LON = Number(process.env.TEST_BASE_LON ?? 127.0);

  const distances = [500, 1000, 2000];
  const bearings = [0, 120, 240]; // spread around

  const redis = await getRedis();
  const hobbyIds = await getFirstNHobbyIds(5);

  // token generation removed

  for (let i = 0; i < distances.length; i += 1) {
    const d = distances[i];
    const b = bearings[i % bearings.length];
    const { latitude, longitude } = projectPoint(BASE_LAT, BASE_LON, d, b);

    const email = `tester_${d}m@example.com`;
    const username = `tester_${d}m`;
    const { id: userId } = await upsertUser(email, username, "123456789");
    await upsertLocation(userId, latitude, longitude);
    for (const hid of hobbyIds) {
      await attachHobby(userId, hid);
    }
    await updateRedisGeo(redis, userId, latitude, longitude);
    // eslint-disable-next-line no-console
    console.log(
      `Created/updated ${email} at ${d}m -> (${latitude}, ${longitude})`
    );
  }

  await redis.quit();

  // no token output
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
