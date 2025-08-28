import { IsNotEmpty, IsString, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class PauseHistoryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  userName!: string;

  @Type(() => Date)
  @IsDate()
  date!: Date;

  @IsString()
  @IsNotEmpty()
  planId!: string;

  @IsString()
  @IsNotEmpty()
  planName!: string;

  @IsNumber()
  duration!: number;

  @IsNumber()
  completionRate!: number;
}
