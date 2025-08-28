import { IsString, IsNotEmpty, IsDateString, IsObject, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AssignedPlan {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  time!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  color!: string;
}

export class UpdatePlanStatusDto {
  @ApiProperty({
    description: 'Estado activo/inactivo del plan',
    example: true
  })
  @IsBoolean()
  isActive!: boolean;
}

export class NotificationPlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  time!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          time: { type: 'string' },
          color: { type: 'string' }
        }
      }
    },
    description: 'Planes asignados por fecha'
  })
  @IsObject()
  @ValidateNested()
  @Type(() => AssignedPlan)
  assignedPlans!: Record<string, AssignedPlan[]>;

  @ApiProperty({ default: true })
  @IsBoolean()
  isActive?: boolean;
}
