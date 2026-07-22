import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReleaseFundsDto {
  @ApiProperty({ description: 'Milestone ID to release funds for' })
  @IsUUID()
  @IsNotEmpty()
  milestoneId!: string;
}
