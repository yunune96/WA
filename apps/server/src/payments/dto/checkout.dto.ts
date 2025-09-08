import { IsEnum, IsInt, Min } from "class-validator";

export enum ProviderType {
  toss = "toss",
  kakao = "kakao",
}

export class CheckoutDto {
  @IsInt()
  @Min(1)
  coins!: number;

  @IsEnum(ProviderType)
  provider!: ProviderType;
}


