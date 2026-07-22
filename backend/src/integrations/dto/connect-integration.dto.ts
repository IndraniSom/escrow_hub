import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConnectIntegrationDto {
  @ApiProperty({ description: 'Plugin name (e.g. github, slack, discord)' })
  @IsString()
  @IsNotEmpty()
  plugin!: string;

  @ApiPropertyOptional({ description: 'OAuth scopes to request' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}
