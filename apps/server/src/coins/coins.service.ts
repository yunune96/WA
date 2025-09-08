import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../core/database/prisma.service";

@Injectable()
export class CoinsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    return { balance: wallet?.balance ?? 0 };
  }

  async getTransactions(userId: string) {
    const txs = await this.prisma.coinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return txs;
  }

  async spend(userId: string, coins: number, reason: string) {
    if (!Number.isInteger(coins) || coins <= 0) {
      throw new ConflictException("coins must be a positive integer");
    }
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: { userId, balance: 0 },
        update: {},
      });
      if (wallet.balance < coins) {
        throw new ConflictException("INSUFFICIENT_BALANCE");
      }
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: coins } },
      });
      await tx.coinTransaction.create({
        data: { userId, change: -coins, reason },
      });
      const updated = await tx.wallet.findUnique({ where: { userId } });
      return { balance: updated?.balance ?? 0 };
    });
  }
}


