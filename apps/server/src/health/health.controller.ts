import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  public liveness() {
    return { status: "ok" };
  }

  @Get("ready")
  public readiness() {
    return { status: "ready" };
  }
}
