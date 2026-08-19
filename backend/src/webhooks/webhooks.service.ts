import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async processWebhook(
    source: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    this.logger.log(`Processing webhook from ${source}: ${event}`);

    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        source,
        event,
        payload: payload as unknown as Prisma.InputJsonValue,
        processed: false,
      },
    });

    try {
      await this.handleEvent(source, event, payload);
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { processed: true },
      });
    } catch (error) {
      this.logger.error(
        `Failed to process webhook ${webhookEvent.id}: ${error instanceof Error ? error.message : ''}`,
      );
    }

    return { received: true, id: webhookEvent.id };
  }

  private async handleEvent(
    source: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    switch (source) {
      case 'github':
        await this.handleGitHubEvent(event, payload);
        break;
      case 'slack':
        await this.handleSlackEvent(event, payload);
        break;
      case 'discord':
        await this.handleDiscordEvent(event, payload);
        break;
      default:
        this.logger.warn(`Unknown webhook source: ${source}`);
    }
  }

  private async handleGitHubEvent(
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(`Handling GitHub event: ${event}`);

    if (event === 'push') {
      const repo = (payload as { repository?: { full_name?: string } }).repository?.full_name;
      if (repo) {
        const projects = await this.prisma.project.findMany({
          where: { githubRepo: { contains: repo } },
        });

        for (const project of projects) {
          await this.prisma.notification.create({
            data: {
              userId: project.clientId,
              type: 'github_push',
              title: `New push to ${repo}`,
              body: `Repository ${repo} has received a new push.`,
              metadata: { projectId: project.id, event, payload } as unknown as Prisma.InputJsonValue,
            },
          });
        }
      }
    }

    if (event === 'pull_request' || event === 'pull_request_review') {
      this.logger.log(`PR event received: ${event}`);
    }
  }

  private async handleSlackEvent(
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(`Handling Slack event: ${event}`);
    const slackEvent = payload as { event?: { type?: string; channel?: string; user?: string; text?: string } };
    if (slackEvent.event?.type === 'message') {
      this.logger.log(`Slack message in channel ${slackEvent.event.channel} from user ${slackEvent.event.user}`);
    }
  }

  private async handleDiscordEvent(
    event: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(`Handling Discord event: ${event}`);
    const discordEvent = payload as { t?: string; d?: { channel_id?: string; author?: { id?: string }; content?: string } };
    if (discordEvent.t === 'MESSAGE_CREATE' && discordEvent.d) {
      this.logger.log(`Discord message in channel ${discordEvent.d.channel_id} from ${discordEvent.d.author?.id}`);
    }
  }

  verifySignature(headers: Record<string, string>, body: string): boolean {
    const signingSecret =
      this.configService.get<string>('CORSAIR_SIGNING_SECRET') || '';

    if (!signingSecret) {
      this.logger.warn('No signing secret configured, skipping verification');
      return true;
    }

    const signature = headers['x-corsair-signature'] || headers['x-hub-signature-256'];
    if (!signature) {
      throw new UnauthorizedException('No signature header found');
    }

    const expectedSignature = crypto
      .createHmac('sha256', signingSecret)
      .update(body)
      .digest('hex');

    const receivedSignature = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    if (expectedSignature !== receivedSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }
}
