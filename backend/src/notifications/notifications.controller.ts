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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { StellarAuthGuard } from '../common/guards/stellar-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user notifications' })
  async findMyNotifications(
    @CurrentUser() user: { stellarAddress: string },
    @Query() pagination: PaginationDto,
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.notificationsService.findByUser(userRecord.id, pagination);
  }

  @Post()
  @UseGuards(StellarAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a notification' })
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id/read')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.notificationsService.markAsRead(id, userRecord.id);
  }

  @Post('read-all')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: { stellarAddress: string }) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.notificationsService.markAllAsRead(userRecord.id);
  }

  @Delete(':id')
  @UseGuards(StellarAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a notification' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { stellarAddress: string },
  ) {
    const userRecord = await this.prisma.user.findUniqueOrThrow({
      where: { stellarAddress: user.stellarAddress },
    });
    return this.notificationsService.delete(id, userRecord.id);
  }
}
