import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitReviewDto } from './dto/submit-review.dto';

@Injectable()
export class ReputationService {
  constructor(private readonly prisma: PrismaService) {}

  async getReputation(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const reviews = await this.prisma.review.findMany({
      where: { toId: userId },
      include: {
        from: true,
        project: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    return {
      userId,
      stellarAddress: user.stellarAddress,
      username: user.username,
      displayName: user.displayName,
      reputationScore: user.reputationScore,
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      completedProjects: user.completedProjects,
      totalProjects: user.totalProjects,
      reviews,
    };
  }

  async submitReview(fromId: string, dto: SubmitReviewDto) {
    if (fromId === dto.toId) {
      throw new BadRequestException('Cannot review yourself');
    }

    const toUser = await this.prisma.user.findUnique({
      where: { id: dto.toId },
    });

    if (!toUser) {
      throw new NotFoundException('Target user not found');
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    const existing = await this.prisma.review.findFirst({
      where: {
        fromId,
        toId: dto.toId,
        projectId: dto.projectId ?? undefined,
      },
    });

    if (existing) {
      throw new BadRequestException('You have already reviewed this user for this project');
    }

    const review = await this.prisma.review.create({
      data: {
        fromId,
        toId: dto.toId,
        projectId: dto.projectId || null,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        from: true,
        to: true,
      },
    });

    await this.updateReputationScore(dto.toId);

    return review;
  }

  private async updateReputationScore(userId: string): Promise<void> {
    const reviews = await this.prisma.review.findMany({
      where: { toId: userId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10,
          )
        : 0;

    const completedProjects = await this.prisma.project.count({
      where: {
        freelancerId: userId,
        status: 'COMPLETED',
      },
    });

    const totalProjects = await this.prisma.project.count({
      where: {
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
    });

    const reputationScore = averageRating * 10 + completedProjects * 5;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore,
        completedProjects,
        totalProjects,
      },
    });
  }
}
