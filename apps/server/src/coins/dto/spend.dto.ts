import { IsInt, Min, IsOptional, IsString, MaxLength } from "class-validator";

export class SpendDto {
  @IsInt()
  @Min(1)
  coins!: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  reason?: string;
}


