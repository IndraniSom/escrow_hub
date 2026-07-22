import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMilestoneDto } from './dto/create-milestone.dto';
import { UpdateMilestoneDto } from './dto/update-milestone.dto';
import { MilestoneStatus } from '@prisma/client';

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMilestoneDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.milestone.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: {
        project: true,
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    return milestone;
  }

  async update(id: string, dto: UpdateMilestoneDto) {
    await this.findById(id);

    const updatableFields: Record<string, unknown> = {};
    if (dto.title !== undefined) updatableFields.title = dto.title;
    if (dto.description !== undefined) updatableFields.description = dto.description;
    if (dto.amount !== undefined) updatableFields.amount = dto.amount;
    if (dto.dueDate !== undefined) updatableFields.dueDate = new Date(dto.dueDate);
    if (dto.status !== undefined) updatableFields.status = dto.status;
    if (dto.submissionUri !== undefined) updatableFields.submissionUri = dto.submissionUri;

    return this.prisma.milestone.update({
      where: { id },
      data: updatableFields,
    });
  }

  async startMilestone(id: string, userId?: string): Promise<unknown> {
    const milestone = await this.findById(id);

    if (userId) {
      const project = await this.prisma.project.findUnique({ where: { id: milestone.projectId } });
      if (project && project.freelancerId !== userId) {
        throw new ForbiddenException('Only the assigned freelancer can start milestone work');
      }
    }

    if (milestone.status !== MilestoneStatus.PENDING) {
      throw new BadRequestException('Milestone must be in PENDING status to start');
    }

    return this.prisma.milestone.update({
      where: { id },
      data: { status: MilestoneStatus.IN_PROGRESS },
    });
  }

  async submitMilestone(id: string, submissionUri: string, userId?: string) {
    const milestone = await this.findById(id);

    if (userId) {
      const project = await this.prisma.project.findUnique({ where: { id: milestone.projectId } });
      if (project && project.freelancerId !== userId) {
        throw new ForbiddenException('Only the assigned freelancer can submit milestone work');
      }
    }

    if (milestone.status !== MilestoneStatus.IN_PROGRESS && milestone.status !== MilestoneStatus.PENDING) {
      throw new BadRequestException(
        'Milestone must be in PENDING or IN_PROGRESS status to submit',
      );
    }

    return this.prisma.milestone.update({
      where: { id },
      data: {
        status: MilestoneStatus.SUBMITTED,
        submissionUri,
      },
    });
  }

  async approveMilestone(id: string, userId?: string) {
    const milestone = await this.findById(id);

    if (userId) {
      const project = await this.prisma.project.findUnique({ where: { id: milestone.projectId } });
      if (project && project.clientId !== userId) {
        throw new ForbiddenException('Only the project client can approve milestones');
      }
    }

    if (milestone.status !== MilestoneStatus.SUBMITTED) {
      throw new BadRequestException(
        'Milestone must be in SUBMITTED status to approve',
      );
    }

    return this.prisma.milestone.update({
      where: { id },
      data: {
        status: MilestoneStatus.APPROVED,
        completedAt: new Date(),
      },
    });
  }

  async rejectMilestone(id: string, userId?: string) {
    const milestone = await this.findById(id);

    if (userId) {
      const project = await this.prisma.project.findUnique({ where: { id: milestone.projectId } });
      if (project && project.clientId !== userId) {
        throw new ForbiddenException('Only the project client can reject milestones');
      }
    }

    if (milestone.status !== MilestoneStatus.SUBMITTED) {
      throw new BadRequestException(
        'Milestone must be in SUBMITTED status to reject',
      );
    }

    return this.prisma.milestone.update({
      where: { id },
      data: {
        status: MilestoneStatus.REJECTED,
      },
    });
  }
}
