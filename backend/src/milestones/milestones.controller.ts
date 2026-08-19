import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MilestonesService } from './milestones.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { SubmitMilestoneDto } from './dto/submit-milestone.dto';
import { StellarAuthGuard } from '../common/guards/stellar-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Milestones')
@Controller('milestones')
export class MilestonesController {
  constructor(
    private readonly milestonesService: MilestonesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(StellarAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new milestone' })
  async create(@Body() dto: CreateMilestoneDto) {
    return this.milestonesService.create(dto);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all milestones for a project' })
  async findByProject(@Param('projectId') projectId: string) {
    return this.milestonesService.findByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get milestone by ID' })
  async findById(@Param('id') id: string) {
    return this.milestonesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update milestone' })
  async update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
    return this.milestonesService.update(id, dto);
  }

  @Post(':id/start')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start milestone work' })
  async start(
    @Param('id') id: string,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.milestonesService.startMilestone(id, userRecord.id);
  }

  @Post(':id/submit')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit milestone work' })
  async submit(
    @Param('id') id: string,
    @Body() dto: SubmitMilestoneDto,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({ where: { stellarAddress: user.stellarAddress } });
    return this.milestonesService.submitMilestone(id, dto.submissionUri, userRecord.id);
  }

  @Post(':id/approve')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve milestone' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({ where: { stellarAddress: user.stellarAddress } });
    return this.milestonesService.approveMilestone(id, userRecord.id);
  }

  @Post(':id/reject')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject milestone' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({ where: { stellarAddress: user.stellarAddress } });
    return this.milestonesService.rejectMilestone(id, userRecord.id);
  }
}
