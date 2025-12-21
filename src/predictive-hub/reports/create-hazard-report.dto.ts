// src/predictive-hub/reports/dto/create-hazard-report.dto.ts
import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateHazardReportDto {
  @IsString()
  region: string; // e.g. PK-ISB

  @IsUUID()
  disasterTypeId: string;

  @IsString()
  text: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  severity: number; // 1..5

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  waterDepthCm?: number;

  @IsOptional()
  @IsNumber()
  peopleAffected?: number;

  @IsOptional()
  photoUrls?: string[];
}
