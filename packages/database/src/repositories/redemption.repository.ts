import { PrismaClient, RedemptionRequest, RedemptionStatus, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class RedemptionRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<RedemptionRequest | null> {
    return this.prisma.redemptionRequest.findUnique({ where: { idempotencyKey } });
  }

  async findById(id: string): Promise<RedemptionRequest | null> {
    return this.prisma.redemptionRequest.findUnique({ where: { id } });
  }

  async create(data: Prisma.RedemptionRequestCreateInput): Promise<RedemptionRequest> {
    return this.prisma.redemptionRequest.create({ data });
  }

  async updateStatus(
    id: string,
    status: RedemptionStatus,
    failureReason?: string
  ): Promise<RedemptionRequest> {
    return this.prisma.redemptionRequest.update({
      where: { id },
      data: {
        status,
        processedAt: status === RedemptionStatus.COMPLETED ? new Date() : undefined,
        failureReason,
      },
    });
  }

  async findByUserId(
    userId: string,
    params: { skip?: number; take?: number }
  ): Promise<{ data: RedemptionRequest[]; total: number }> {
    const { skip = 0, take = 20 } = params;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.redemptionRequest.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.redemptionRequest.count({ where: { userId } }),
    ]);
    return { data, total };
  }
}
