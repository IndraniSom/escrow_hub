import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async connect(userId: string, dto: ConnectIntegrationDto) {
    const existing = await this.prisma.integration.findFirst({
      where: {
        userId,
        plugin: dto.plugin,
      },
    });

    if (existing && existing.status === 'connected') {
      throw new ConflictException(
        `Integration with ${dto.plugin} is already connected`,
      );
    }

    if (existing) {
      return this.prisma.integration.update({
        where: { id: existing.id },
        data: {
          status: 'connected',
          scopes: dto.scopes || [],
        },
      });
    }

    return this.prisma.integration.create({
      data: {
        userId,
        plugin: dto.plugin,
        status: 'connected',
        scopes: dto.scopes || [],
      },
    });
  }

  async disconnect(id: string, userId: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    return this.prisma.integration.update({
      where: { id },
      data: {
        status: 'disconnected',
        accessToken: null,
        refreshToken: null,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlugin(userId: string, plugin: string) {
    return this.prisma.integration.findFirst({
      where: { userId, plugin },
    });
  }

  async update(id: string, userId: string, dto: UpdateIntegrationDto) {
    const integration = await this.prisma.integration.findFirst({
      where: { id, userId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    return this.prisma.integration.update({
      where: { id },
      data: {
        status: dto.status,
        metadata: (dto.metadata as unknown as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  createConnectUrl(plugin: string, tenantId: string): string {
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:4000';
    return `${baseUrl}/integrations/${plugin}/authorize?tenantId=${tenantId}`;
  }

  getAuthorizationHeaders(): Record<string, string> {
    const corsairApiKey = this.configService.get<string>('CORSAIR_API_KEY') || '';
    if (corsairApiKey) {
      return { Authorization: `Bearer ${corsairApiKey}` };
    }
    return {};
  }
}
