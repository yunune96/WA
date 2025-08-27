import { Injectable } from "@nestjs/common";

import { PrismaService } from "../core/database/prisma.service";

@Injectable()
export class HobbiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.hobby.findMany();
  }
}
