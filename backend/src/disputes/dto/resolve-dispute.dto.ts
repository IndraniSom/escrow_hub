import { IsString, IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Verdict } from '@prisma/client';

export class ResolveDisputeDto {
  @ApiProperty({ enum: Verdict, description: 'Dispute verdict' })
  @IsEnum(Verdict)
  verdict!: Verdict;

  @ApiPropertyOptional({ description: 'Amount to release to client' })
  @IsOptional()
  @IsNumberString()
  clientAmount?: string;

  @ApiPropertyOptional({ description: 'Amount to release to freelancer' })
  @IsOptional()
  @IsNumberString()
  freelancerAmount?: string;

  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  resolution?: string;
}
