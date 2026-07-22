import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Server } from '@stellar/stellar-sdk';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly stellarRpcUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stellarRpcUrl =
      this.configService.get<string>('STELLAR_RPC_URL') ||
      'https://soroban-testnet.stellar.org';
  }

  async getBalance(userId: string) {
    const [depositsResult, withdrawalsResult] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId, type: { in: ['deposit', 'payment'] } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: { in: ['withdrawal', 'release'] } },
        _sum: { amount: true },
      }),
    ]);

    const deposits = BigInt(depositsResult._sum.amount || '0');
    const withdrawals = BigInt(withdrawalsResult._sum.amount || '0');
    const balance = (deposits - withdrawals).toString();

    const tokenGroup = await this.prisma.transaction.groupBy({
      by: ['tokenSymbol', 'type'],
      where: { userId },
      _sum: { amount: true },
    });

    const tokenBalances: Record<string, string> = {};
    for (const group of tokenGroup) {
      const symbol = group.tokenSymbol || 'USDC';
      const amount = BigInt(group._sum.amount || '0');
      if (!tokenBalances[symbol]) tokenBalances[symbol] = '0';
      if (group.type === 'deposit' || group.type === 'payment') {
        tokenBalances[symbol] = (BigInt(tokenBalances[symbol]) + amount).toString();
      } else {
        tokenBalances[symbol] = (BigInt(tokenBalances[symbol]) - amount).toString();
      }
    }

    return {
      userId,
      balance,
      tokenBalances,
      currency: 'USDC',
    };
  }

  async getTransactions(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where: { userId } }),
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

  async createTransaction(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        userId,
        type: dto.type,
        amount: dto.amount,
        tokenSymbol: dto.tokenSymbol || 'USDC',
        stellarTxHash: dto.stellarTxHash,
        description: dto.description,
        metadata: dto.metadata || undefined,
        status: 'completed',
      },
    });
  }

  async getStellarBalance(stellarAddress: string) {
    try {
      const server = new Server(
        this.configService.get<string>('STELLAR_NETWORK') === 'PUBLIC'
          ? 'https://horizon.stellar.org'
          : 'https://horizon-testnet.stellar.org',
      );

      const account = await server.loadAccount(stellarAddress);
      const balances = account.balances.map((b: { asset_type: string; asset_code?: string; balance: string }) => ({
        assetType: b.asset_type,
        assetCode: b.asset_code || 'XLM',
        balance: b.balance,
      }));

      return {
        stellarAddress,
        balances,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch Stellar balance for ${stellarAddress}`,
        error instanceof Error ? error.message : '',
      );
      return {
        stellarAddress,
        balances: [],
        error: 'Failed to fetch balance from Stellar network',
      };
    }
  }
}
