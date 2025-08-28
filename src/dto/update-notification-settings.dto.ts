import { IsBoolean, IsString, IsNumber } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsBoolean()
  notificationsEnabled!: boolean;

  @IsString()
  frequency!: string;

  @IsBoolean()
  activeBreaks!: boolean;

  @IsNumber()
  startHour!: number;

  @IsNumber()
  startMinute!: number;

  @IsNumber()
  endHour!: number;

  @IsNumber()
  endMinute!: number;
}
