import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ description: 'Stellar public key' })
  @IsString()
  @IsNotEmpty()
  publicKey!: string;

  @ApiProperty({ description: 'Signed challenge string (base64)' })
  @IsString()
  @IsNotEmpty()
  signature!: string;

  @ApiProperty({ description: 'Challenge string that was signed' })
  @IsString()
  @IsNotEmpty()
  challenge!: string;
}
