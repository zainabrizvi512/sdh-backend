import { IsDateString, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Gender } from '../user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  fullName?: string;

  @IsOptional()
  @IsString()
  // Pakistan pattern: 03xx-xxxxxxx or digits only; tweak per need
  @Matches(/^(\+?\d{8,15}|03\d{2}-?\d{7})$/)
  phone?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString() // ISO date "YYYY-MM-DD" ok
  dob?: string;

  @IsOptional()
  @IsString()
  picture?: string;
}

