import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitMilestoneDto {
  @ApiProperty({ description: 'URI pointing to the submitted work (e.g. PR URL, file link)' })
  @IsString()
  @IsNotEmpty()
  submissionUri!: string;
}
