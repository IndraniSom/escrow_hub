import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Escrow amount as string (to preserve precision)' })
  @IsNumberString()
  @IsNotEmpty()
  escrowAmount!: string;

  @ApiPropertyOptional({ description: 'Token symbol', default: 'USDC' })
  @IsOptional()
  @IsString()
  tokenSymbol?: string;

  @ApiPropertyOptional({ description: 'Freelancer Stellar address' })
  @IsOptional()
  @IsString()
  freelancerAddress?: string;

  @ApiPropertyOptional({ description: 'Project deadline' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ description: 'GitHub repository URL' })
  @IsOptional()
  @IsString()
  githubRepo?: string;
}
