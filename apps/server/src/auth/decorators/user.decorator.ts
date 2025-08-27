import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";

// User 값을 파라미터로 받을 수 있게 하는 공통 데코레이터
export const User = createParamDecorator(
  (data: keyof UserEntity | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  }
);
