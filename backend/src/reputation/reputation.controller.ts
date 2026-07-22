import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReputationService } from './reputation.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { StellarAuthGuard } from '../common/guards/stellar-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Reputation')
@Controller('reputation')
export class ReputationController {
  constructor(
    private readonly reputationService: ReputationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get user reputation and reviews' })
  async getReputation(@Param('userId') userId: string) {
    return this.reputationService.getReputation(userId);
  }

  @Post('review')
  @UseGuards(StellarAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a review for a user' })
  async submitReview(
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.reputationService.submitReview(userRecord.id, dto);
  }
}
