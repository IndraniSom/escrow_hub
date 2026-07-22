import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { verifyWalletSignature } from '../utils/stellar.utils';

@Injectable()
export class StellarAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Stellar') {
      throw new UnauthorizedException(
        'Invalid authorization format. Use: Stellar <signature>',
      );
    }

    const signature = parts[1];
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

    request.user = { stellarAddress: publicKey };
    return true;
  }
}
