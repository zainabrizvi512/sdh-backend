import { IsString, IsNumber } from "class-validator";

export class CreateRequestDto {
  @IsString()
  resourceType: string;

  @IsNumber()
  quantity: number;
}