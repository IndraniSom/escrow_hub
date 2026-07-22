import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { StellarAuthGuard } from '../common/guards/stellar-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProjectStatus } from '@prisma/client';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(StellarAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.projectsService.create(dto, userRecord.id);
  }

  @Get()
  @ApiOperation({ summary: 'List projects with pagination' })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.projectsService.findAll(pagination, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findById(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update project' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.projectsService.update(id, dto, userRecord.id);
  }

  @Delete(':id')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete project' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.projectsService.delete(id, userRecord.id);
  }
}
