import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Horizon } from '@stellar/stellar-sdk';

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
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const tokenBalances: Record<string, bigint> = {};
    for (const tx of transactions) {
      const symbol = tx.tokenSymbol || 'USDC';
      if (!tokenBalances[symbol]) tokenBalances[symbol] = 0n;
      const amount = BigInt(tx.amount || '0');
      if (tx.type === 'deposit' || tx.type === 'payment') {
        tokenBalances[symbol] += amount;
      } else {
        tokenBalances[symbol] -= amount;
      }
    }

    const total = Object.values(tokenBalances).reduce((acc, b) => acc + b, 0n);
    const formatted: Record<string, string> = {};
    for (const [symbol, balance] of Object.entries(tokenBalances)) {
      formatted[symbol] = balance.toString();
    }

    return {
      userId,
      balance: total.toString(),
      tokenBalances: formatted,
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
        metadata: (dto.metadata as unknown as Prisma.InputJsonValue) ?? undefined,
        status: 'completed',
      },
    });
  }

  async getStellarBalance(stellarAddress: string) {
    try {
      const server = new Horizon.Server(
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
