import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Transaction type (deposit, withdrawal, payment, release)' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiProperty({ description: 'Transaction amount' })
  @IsNumberString()
  @IsNotEmpty()
  amount!: string;

  @ApiPropertyOptional({ description: 'Token symbol', default: 'USDC' })
  @IsOptional()
  @IsString()
  tokenSymbol?: string;

  @ApiPropertyOptional({ description: 'Stellar transaction hash' })
  @IsOptional()
  @IsString()
  stellarTxHash?: string;

  @ApiPropertyOptional({ description: 'Transaction description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
