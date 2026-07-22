import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FundEscrowDto } from './dto/fund-escrow.dto';
import { EscrowState, ProjectStatus, MilestoneStatus } from '@prisma/client';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createEscrow(dto: FundEscrowDto, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: {
        client: true,
        freelancer: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (userId && project.clientId !== userId) {
      throw new ForbiddenException('Only the project client can create an escrow');
    }

    if (!project.freelancerId) {
      throw new BadRequestException('Project must have a freelancer assigned');
    }

    const existing = await this.prisma.escrow.findUnique({
      where: { projectId: dto.projectId },
    });

    if (existing) {
      throw new BadRequestException('Escrow already exists for this project');
    }

    const escrow = await this.prisma.escrow.create({
      data: {
        projectId: dto.projectId,
        stellarEscrowId: dto.stellarEscrowId,
        contractId: dto.contractId,
        clientAddress: project.client.stellarAddress,
        freelancerAddress: project.freelancer!.stellarAddress,
        tokenAddress: dto.tokenAddress,
        amount: dto.amount,
        state: EscrowState.FUNDED,
        milestoneCount: await this.prisma.milestone.count({
          where: { projectId: dto.projectId },
        }),
      },
    });

    await this.prisma.project.update({
      where: { id: dto.projectId },
      data: {
        status: ProjectStatus.FUNDED,
        stellarEscrowId: dto.stellarEscrowId,
        escrowContractId: dto.contractId,
      },
    });

    return escrow;
  }

  async fundEscrow(projectId: string, userId?: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { projectId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found for this project');
    }

    if (userId) {
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (project && project.clientId !== userId) {
        throw new ForbiddenException('Only the project client can fund escrow');
      }
    }

    if (escrow.state !== EscrowState.FUNDED) {
      throw new BadRequestException('Escrow is not in FUNDED state');
    }

    const updated = await this.prisma.escrow.update({
      where: { projectId },
      data: { state: EscrowState.ACTIVE },
    });

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.IN_PROGRESS },
    });

    return updated;
  }

  async releaseFunds(projectId: string, milestoneId: string, userId?: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { projectId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (userId) {
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (project && project.clientId !== userId) {
        throw new ForbiddenException('Only the project client can release funds');
      }
    }

    if (escrow.state !== EscrowState.ACTIVE && escrow.state !== EscrowState.FUNDED) {
      throw new BadRequestException('Escrow is not active');
    }

    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone || milestone.projectId !== projectId) {
      throw new NotFoundException('Milestone not found for this project');
    }

    if (milestone.status !== MilestoneStatus.APPROVED) {
      throw new BadRequestException('Milestone must be approved before releasing funds');
    }

    const newCompleted = escrow.completedMilestones + 1;
    const newReleased = (
      BigInt(escrow.releasedAmount || '0') + BigInt(milestone.amount || '0')
    ).toString();

    let newState = escrow.state;
    let newProjectStatus = ProjectStatus.IN_PROGRESS;

    if (newCompleted >= escrow.milestoneCount) {
      newState = EscrowState.COMPLETED;
      newProjectStatus = ProjectStatus.COMPLETED;
    }

    await this.prisma.escrow.update({
      where: { projectId },
      data: {
        releasedAmount: newReleased,
        completedMilestones: newCompleted,
        state: newState,
      },
    });

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: newProjectStatus },
    });

    return { released: true, newState, completedMilestones: newCompleted };
  }

  async refundEscrow(projectId: string, userId?: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { projectId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (userId) {
      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (project && project.clientId !== userId) {
        throw new ForbiddenException('Only the project client can refund escrow');
      }
    }

    if (escrow.state === EscrowState.COMPLETED) {
      throw new BadRequestException('Cannot refund a completed escrow');
    }

    const updated = await this.prisma.escrow.update({
      where: { projectId },
      data: { state: EscrowState.REFUNDED },
    });

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.CANCELLED },
    });

    return updated;
  }

  async disputeEscrow(projectId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { projectId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    const updated = await this.prisma.escrow.update({
      where: { projectId },
      data: { state: EscrowState.DISPUTED },
    });

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.DISPUTED },
    });

    return updated;
  }

  async resolveDispute(
    projectId: string,
    clientAmount: string,
    freelancerAmount: string,
  ) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { projectId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found');
    }

    if (escrow.state !== EscrowState.DISPUTED) {
      throw new BadRequestException('Escrow is not in disputed state');
    }

    if (!clientAmount && !freelancerAmount) {
      throw new BadRequestException('At least one of clientAmount or freelancerAmount must be provided');
    }

    const updated = await this.prisma.escrow.update({
      where: { projectId },
      data: {
        state: EscrowState.COMPLETED,
        releasedAmount: (
          BigInt(clientAmount || '0') + BigInt(freelancerAmount || '0')
        ).toString(),
      },
    });

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.COMPLETED },
    });

    return updated;
  }

  async getEscrowByProject(projectId: string) {
    const escrow = await this.prisma.escrow.findUnique({
      where: { projectId },
    });

    if (!escrow) {
      throw new NotFoundException('Escrow not found for this project');
    }

    return escrow;
  }
}
