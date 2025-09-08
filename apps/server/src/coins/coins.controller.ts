import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { User } from "../auth/decorators/user.decorator";
import { CoinsService } from "./coins.service";
import { SpendDto } from "./dto/spend.dto";

@ApiTags("coins")
@Controller("coins")
@UseGuards(AuthGuard("jwt"))
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get("balance")
  getBalance(@User("id") userId: string) {
    return this.coinsService.getBalance(userId);
  }

  @Get("transactions")
  getTransactions(@User("id") userId: string) {
    return this.coinsService.getTransactions(userId);
  }

  @Post("spend")
  spend(@User("id") userId: string, @Body() dto: SpendDto) {
    return this.coinsService.spend(userId, dto.coins, dto.reason ?? "spend");
  }
}


