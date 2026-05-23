import { PrismaClient, User, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    where?: Prisma.UserWhereInput;
  }): Promise<{ data: User[]; total: number }> {
    const { skip = 0, take = 20, orderBy, where } = params;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ skip, take, orderBy, where }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total };
  }
}
