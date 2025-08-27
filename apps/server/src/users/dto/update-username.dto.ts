import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class UpdateUsernameDto {
  @ApiProperty({ example: "새닉네임", required: true })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  username!: string;
}


