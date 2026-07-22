import {
  IsString,
  IsOptional,
  IsNumberString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Project title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Project status' })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Escrow amount' })
  @IsOptional()
  @IsNumberString()
  escrowAmount?: string;

  @ApiPropertyOptional({ description: 'Token symbol' })
  @IsOptional()
  @IsString()
  tokenSymbol?: string;

  @ApiPropertyOptional({ description: 'Stellar escrow ID' })
  @IsOptional()
  @IsString()
  stellarEscrowId?: string;

  @ApiPropertyOptional({ description: 'Escrow contract ID' })
  @IsOptional()
  @IsString()
  escrowContractId?: string;

  @ApiPropertyOptional({ description: 'Freelancer ID' })
  @IsOptional()
  @IsString()
  freelancerId?: string;

  @ApiPropertyOptional({ description: 'Project deadline' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'GitHub repository URL' })
  @IsOptional()
  @IsString()
  githubRepo?: string;
}
