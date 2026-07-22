import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config: Record<string, unknown>) => {
        const requiredVars = [
          'DATABASE_URL',
          'JWT_SECRET',
          'STELLAR_NETWORK',
          'STELLAR_RPC_URL',
        ];
        for (const key of requiredVars) {
          if (!config[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
          }
        }
        return config as Record<string, string>;
      },
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
