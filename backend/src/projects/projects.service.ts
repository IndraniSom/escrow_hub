import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProjectStatus } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, clientId: string) {
    let freelancerId: string | undefined;

    if (dto.freelancerAddress) {
      const freelancer = await this.prisma.user.findUnique({
        where: { stellarAddress: dto.freelancerAddress },
      });
      if (freelancer) {
        freelancerId = freelancer.id;
      }
    }

    return this.prisma.project.create({
      data: {
        title: dto.title,
        description: dto.description,
        escrowAmount: dto.escrowAmount,
        tokenSymbol: dto.tokenSymbol || 'USDC',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        githubRepo: dto.githubRepo,
        clientId,
        freelancerId,
      },
      include: {
        client: true,
        freelancer: true,
      },
    });
  }

  async findAll(pagination: PaginationDto, status?: ProjectStatus) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          freelancer: true,
          _count: {
            select: {
              milestones: true,
              disputes: true,
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        freelancer: true,
        milestones: {
          orderBy: { createdAt: 'asc' },
        },
        disputes: {
          include: {
            raisedBy: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId?: string) {
    const project = await this.findById(id);

    if (userId && project.clientId !== userId) {
      throw new ForbiddenException('Only the project client can update this project');
    }

    const updatableFields: Record<string, unknown> = {};
    if (dto.title !== undefined) updatableFields.title = dto.title;
    if (dto.description !== undefined) updatableFields.description = dto.description;
    if (dto.escrowAmount !== undefined) updatableFields.escrowAmount = dto.escrowAmount;
    if (dto.tokenSymbol !== undefined) updatableFields.tokenSymbol = dto.tokenSymbol;
    if (dto.deadline !== undefined) updatableFields.deadline = new Date(dto.deadline);
    if (dto.githubRepo !== undefined) updatableFields.githubRepo = dto.githubRepo;

    return this.prisma.project.update({
      where: { id },
      data: updatableFields,
      include: {
        client: true,
        freelancer: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    const project = await this.findById(id);

    if (project.clientId !== userId) {
      throw new ForbiddenException('Only the project owner can delete this project');
    }

    await this.prisma.project.delete({ where: { id } });

    return { message: 'Project deleted successfully' };
  }

  async findByClient(clientId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { clientId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          freelancer: true,
        },
      }),
      this.prisma.project.count({ where: { clientId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByFreelancer(freelancerId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { freelancerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          freelancer: true,
        },
      }),
      this.prisma.project.count({ where: { freelancerId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
