import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class UpdatePasswordDto {
  @ApiProperty({ example: "oldPassword123", required: true })
  @IsString()
  oldPassword!: string;

  @ApiProperty({ example: "newPassword123!", required: true })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}


