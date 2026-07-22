import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from '../escrow/escrow.service';
import { RaiseDisputeDto } from './dto/raise-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { DisputeState, Verdict } from '@prisma/client';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
  ) {}

  async raise(dto: RaiseDisputeDto, raisedById: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existingDispute = await this.prisma.dispute.findFirst({
      where: {
        projectId: dto.projectId,
        state: { in: [DisputeState.OPEN, DisputeState.UNDER_REVIEW] },
      },
    });

    if (existingDispute) {
      throw new BadRequestException(
        'An active dispute already exists for this project',
      );
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        projectId: dto.projectId,
        raisedById,
        reason: dto.reason,
        description: dto.description,
        state: DisputeState.OPEN,
      },
      include: {
        project: true,
        raisedBy: true,
      },
    });

    await this.escrowService.disputeEscrow(dto.projectId);

    return dispute;
  }

  async findAll() {
    return this.prisma.dispute.findMany({
      include: {
        project: true,
        raisedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true,
            freelancer: true,
          },
        },
        raisedBy: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    return dispute;
  }

  async resolve(id: string, dto: ResolveDisputeDto) {
    const dispute = await this.findById(id);

    if (dispute.state !== DisputeState.UNDER_REVIEW && dispute.state !== DisputeState.OPEN) {
      throw new BadRequestException('Dispute must be open or under review to resolve');
    }

    const resolved = await this.prisma.dispute.update({
      where: { id },
      data: {
        state: DisputeState.RESOLVED,
        verdict: dto.verdict,
        resolution: dto.resolution,
        clientAmount: dto.clientAmount,
        freelancerAmount: dto.freelancerAmount,
        resolvedAt: new Date(),
      },
    });

    if (dto.verdict !== Verdict.DISMISSED) {
      await this.escrowService.resolveDispute(
        dispute.projectId,
        dto.clientAmount || '0',
        dto.freelancerAmount || '0',
      );
    }

    return resolved;
  }

  async dismiss(id: string) {
    const dispute = await this.findById(id);

    if (
      dispute.state === DisputeState.RESOLVED ||
      dispute.state === DisputeState.DISMISSED
    ) {
      throw new BadRequestException('Dispute is already resolved or dismissed');
    }

    return this.prisma.dispute.update({
      where: { id },
      data: {
        state: DisputeState.DISMISSED,
        verdict: Verdict.DISMISSED,
        resolvedAt: new Date(),
      },
    });
  }
}
