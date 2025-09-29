import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ByIdDto {
  @ApiProperty({ description: 'ID' })
  @IsInt()
  @Type(() => Number)
  id: number;
}