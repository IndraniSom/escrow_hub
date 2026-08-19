import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
import { generateAuthChallenge, verifyWalletSignature } from '../common/utils/stellar.utils';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private challengeStore = new Map<string, { challenge: string; publicKey: string; expiresAt: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  generateChallenge(publicKey?: string): { challengeId: string; challenge: string } {
    const challenge = generateAuthChallenge();
    const challengeId = crypto.randomBytes(16).toString('hex');
    this.challengeStore.set(challengeId, {
      challenge,
      publicKey: publicKey || '',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    setTimeout(() => this.challengeStore.delete(challengeId), 5 * 60 * 1000);
    return { challengeId, challenge };
  }

  async verifySignature(dto: SignInDto): Promise<{ accessToken: string; user: unknown }> {
    const { publicKey, signature, challenge } = dto;

    const storedEntry = [...this.challengeStore.entries()].find(
      ([_, entry]) => entry.challenge === challenge,
    );
    if (!storedEntry) {
      throw new UnauthorizedException('Challenge not found or expired');
    }
    const [challengeId, entry] = storedEntry;
    if (new Date() > entry.expiresAt) {
      this.challengeStore.delete(challengeId);
      throw new UnauthorizedException('Challenge has expired');
    }
    this.challengeStore.delete(challengeId);

    const isValid = verifyWalletSignature(challenge, signature, publicKey);
    if (!isValid) {
      throw new UnauthorizedException('Invalid wallet signature');
    }

    let user = await this.prisma.user.findUnique({
      where: { stellarAddress: publicKey },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          stellarAddress: publicKey,
          username: null,
          displayName: null,
          role: 'FREELANCER', // Default role
          isOnboarded: true,
        },
      });
      this.logger.log(`New user created with Stellar address: ${publicKey}`);
    }

    const payload = {
      sub: user.id,
      stellarAddress: user.stellarAddress,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: this.sanitizeUser(user),
    };
  }

  async validateUser(publicKey: string) {
    const user = await this.prisma.user.findUnique({
      where: { stellarAddress: publicKey },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: any) {
    const { ...sanitized } = user;
    return sanitized;
  }
}
