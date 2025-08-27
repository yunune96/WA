import { IsArray, IsInt, ArrayMaxSize, ArrayMinSize } from "class-validator";

export class SelectHobbiesDto {
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  hobbyIds!: number[];
}
