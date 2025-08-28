import { IsNumber, IsNotEmpty } from 'class-validator';

export class UpdateStatsDto {
  @IsNumber()
  @IsNotEmpty()
  activities_done!: number;

  @IsNumber()
  @IsNotEmpty()
  total_activities!: number;

  @IsNumber()
  @IsNotEmpty()
  total_time!: number;
}
