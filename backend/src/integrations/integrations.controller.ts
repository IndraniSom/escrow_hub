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
import { IntegrationsService } from './integrations.service';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { StellarAuthGuard } from '../common/guards/stellar-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('connect')
  @UseGuards(StellarAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect an integration plugin' })
  async connect(
    @Body() dto: ConnectIntegrationDto,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.integrationsService.connect(userRecord.id, dto);
  }

  @Post(':id/disconnect')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect an integration' })
  async disconnect(
    @Param('id') id: string,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.integrationsService.disconnect(id, userRecord.id);
  }

  @Get()
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user integrations' })
  async findByUser(@CurrentUser() user: { stellarAddress: string }) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.integrationsService.findByUser(userRecord.id);
  }

  @Patch(':id')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an integration' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIntegrationDto,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.integrationsService.update(id, userRecord.id, dto);
  }
}
