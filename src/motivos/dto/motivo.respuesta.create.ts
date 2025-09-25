import { IsString} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateMotivoRespuestaDto {
    @ApiProperty()
    @IsString()
    idUser!: string;

    @ApiProperty()
    @IsString()
    username!: string;

    @ApiProperty()
    @IsString()
    motivo!: string;

    @ApiProperty()
    @IsString()
    createAt!: string;

    @ApiProperty()
    @IsString()
    updatedAt!: string;
}
