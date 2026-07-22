import { IsString, IsNotEmpty, IsUUID, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FundEscrowDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ description: 'Soroban contract ID' })
  @IsString()
  @IsNotEmpty()
  contractId!: string;

  @ApiProperty({ description: 'Stellar escrow entry ID' })
  @IsString()
  @IsNotEmpty()
  stellarEscrowId!: string;

  @ApiProperty({ description: 'Amount to fund' })
  @IsNumberString()
  @IsNotEmpty()
  amount!: string;

  @ApiProperty({ description: 'Token contract address' })
  @IsString()
  @IsNotEmpty()
  tokenAddress!: string;
}
