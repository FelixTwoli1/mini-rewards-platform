import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id, isActive: true },
      include: { rewardAccount: true, wallet: true },
    });

    if (!user) throw new NotFoundException('User not found');
    const { password: _, ...result } = user;
    return result;
  }

  async update(id: string, dto: UpdateUserDto): Promise<Omit<User, 'password'>> {
    const existing = await this.prisma.user.findUnique({ where: { id, isActive: true } });
    if (!existing) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: dto as Prisma.UserUpdateInput,
    });

    const { password: _, ...result } = updated;
    return result;
  }

  async findAll(params: { skip?: number; take?: number }): Promise<{
    data: Omit<User, 'password'>[];
    total: number;
    skip: number;
    take: number;
  }> {
    const { skip = 0, take = 20 } = params;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { isActive: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return { data: users as Omit<User, 'password'>[], total, skip, take };
  }
}
