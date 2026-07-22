import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyWalletDto {
  @ApiProperty({ description: 'Stellar public key to verify' })
  @IsString()
  @IsNotEmpty()
  publicKey!: string;
}
