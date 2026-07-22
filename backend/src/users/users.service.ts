import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { stellarAddress: dto.stellarAddress },
    });

    if (existing) {
      throw new ConflictException('User with this Stellar address already exists');
    }

    return this.prisma.user.create({
      data: {
        stellarAddress: dto.stellarAddress,
        role: dto.role,
        username: dto.username,
      },
    });
  }

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projectsAsClient: true,
            projectsAsFreelancer: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByStellarAddress(stellarAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { stellarAddress },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    const updatableFields: Record<string, unknown> = {};
    if (dto.username !== undefined) updatableFields.username = dto.username;
    if (dto.displayName !== undefined) updatableFields.displayName = dto.displayName;
    if (dto.avatarUrl !== undefined) updatableFields.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) updatableFields.bio = dto.bio;
    if (dto.email !== undefined) updatableFields.email = dto.email;
    if (dto.isOnboarded !== undefined) updatableFields.isOnboarded = dto.isOnboarded;

    return this.prisma.user.update({
      where: { id },
      data: updatableFields,
    });
  }
}
