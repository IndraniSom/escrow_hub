import { IsString, IsNotEmpty, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessWebhookDto {
  @ApiProperty({ description: 'Event type' })
  @IsString()
  @IsNotEmpty()
  event!: string;

  @ApiProperty({ description: 'Webhook payload data' })
  @IsObject()
  @IsNotEmpty()
  payload!: Record<string, unknown>;
}
