import {
  Controller,
  Post,
  Param,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post(':source')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process incoming webhook from external source' })
  async processWebhook(
    @Param('source') source: string,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
  ) {
    const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
    this.webhooksService.verifySignature(headers, rawBody);

    const body = req.body as { event?: string; payload?: Record<string, unknown> };
    return this.webhooksService.processWebhook(source, body.event || 'unknown', body.payload || {});
  }
}
