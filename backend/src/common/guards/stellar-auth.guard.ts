import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyWalletSignature } from '../utils/stellar.utils';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StellarAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    if (parts[0] === 'Bearer') {
      return this.authenticateWithJwt(parts[1], request);
    }

    if (parts[0] === 'Stellar') {
      return this.authenticateWithSignature(parts[1], request);
    }

    throw new UnauthorizedException(
      'Invalid authorization scheme. Use: Bearer <jwt> or Stellar <signature>',
    );
  }

  private async authenticateWithJwt(
    token: string,
    request: any,
  ): Promise<boolean> {
    let payload: { sub?: string; stellarAddress?: string; role?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired JWT');
    }

    const user = await this.prisma.user.findUnique({
      where: { stellarAddress: payload.stellarAddress },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = {
      stellarAddress: user.stellarAddress,
      userId: user.id,
      role: user.role,
    };
    return true;
  }

  private async authenticateWithSignature(
    signature: string,
    request: any,
  ): Promise<boolean> {
    const publicKey = request.headers['x-stellar-public-key'] as string;
    const challenge = request.headers['x-stellar-challenge'] as string;

    if (!publicKey || !challenge) {
      throw new UnauthorizedException(
        'Missing x-stellar-public-key or x-stellar-challenge headers',
      );
    }

    const isValid = verifyWalletSignature(challenge, signature, publicKey);
    if (!isValid) {
      throw new UnauthorizedException('Invalid wallet signature');
    }

    const user = await this.prisma.user.findUnique({
      where: { stellarAddress: publicKey },
    });

    request.user = {
      stellarAddress: publicKey,
      userId: user?.id,
      role: user?.role,
    };
    return true;
  }
}