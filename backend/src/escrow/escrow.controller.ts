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
import { EscrowService } from './escrow.service';
import { FundEscrowDto } from './dto/fund-escrow.dto';
import { ReleaseFundsDto } from './dto/release-funds.dto';
import { StellarAuthGuard } from '../common/guards/stellar-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Escrow')
@Controller('escrow')
export class EscrowController {
  constructor(
    private readonly escrowService: EscrowService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(StellarAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new escrow' })
  async create(
    @Body() dto: FundEscrowDto,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({ where: { stellarAddress: user.stellarAddress } });
    return this.escrowService.createEscrow(dto, userRecord.id);
  }

  @Post(':projectId/fund')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fund an escrow (activate it)' })
  async fund(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({ where: { stellarAddress: user.stellarAddress } });
    return this.escrowService.fundEscrow(projectId, userRecord.id);
  }

  @Post(':projectId/release')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Release funds for an approved milestone' })
  async release(
    @Param('projectId') projectId: string,
    @Body() dto: ReleaseFundsDto,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({ where: { stellarAddress: user.stellarAddress } });
    return this.escrowService.releaseFunds(projectId, dto.milestoneId, userRecord.id);
  }

  @Post(':projectId/refund')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund escrow (cancel project)' })
  async refund(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({ where: { stellarAddress: user.stellarAddress } });
    return this.escrowService.refundEscrow(projectId, userRecord.id);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get escrow details for a project' })
  async getByProject(@Param('projectId') projectId: string) {
    return this.escrowService.getEscrowByProject(projectId);
  }
}
