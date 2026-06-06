import type { AIUsageLog, Prisma, PrismaClient } from '@prisma/client';

export interface CreateAIUsageInput {
  userId: string;
  action: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  cost?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UsageWindowAggregate {
  calls: number;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
}

export class AIUsageLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(input: CreateAIUsageInput): Promise<AIUsageLog> {
    const data: Prisma.AIUsageLogCreateInput = {
      user: { connect: { id: input.userId } },
      action: input.action,
      model: input.model,
      tokensInput: input.tokensInput,
      tokensOutput: input.tokensOutput,
      cost: input.cost ?? 0,
      metadata:
        input.metadata === undefined || input.metadata === null
          ? null
          : JSON.stringify(input.metadata),
    };
    return this.prisma.aIUsageLog.create({ data });
  }

  /** Counts AI calls a user has made since `since`. Used by the rate limiter. */
  countSince(userId: string, since: Date): Promise<number> {
    return this.prisma.aIUsageLog.count({
      where: { userId, createdAt: { gte: since } },
    });
  }

  listRecent(userId: string, limit = 20): Promise<AIUsageLog[]> {
    return this.prisma.aIUsageLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async aggregate(userId: string): Promise<{
    totals: UsageWindowAggregate;
    byAction: Record<string, UsageWindowAggregate>;
  }> {
    const rows = await this.prisma.aIUsageLog.findMany({
      where: { userId },
      select: {
        action: true,
        tokensInput: true,
        tokensOutput: true,
        cost: true,
      },
    });

    const totals: UsageWindowAggregate = { calls: 0, tokensInput: 0, tokensOutput: 0, cost: 0 };
    const byAction: Record<string, UsageWindowAggregate> = {};

    for (const row of rows) {
      totals.calls += 1;
      totals.tokensInput += row.tokensInput;
      totals.tokensOutput += row.tokensOutput;
      totals.cost += row.cost;
      const bucket = (byAction[row.action] ??= {
        calls: 0,
        tokensInput: 0,
        tokensOutput: 0,
        cost: 0,
      });
      bucket.calls += 1;
      bucket.tokensInput += row.tokensInput;
      bucket.tokensOutput += row.tokensOutput;
      bucket.cost += row.cost;
    }

    return { totals, byAction };
  }
}
