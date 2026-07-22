import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MilestoneStatus } from '@prisma/client';

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ description: 'Milestone status' })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @ApiPropertyOptional({ description: 'Submission URI' })
  @IsOptional()
  @IsString()
  submissionUri?: string;
}
