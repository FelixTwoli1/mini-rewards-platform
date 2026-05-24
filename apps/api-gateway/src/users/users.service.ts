import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, isActive: true },
      include: { rewardAccount: true, wallet: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password: _, ...safe } = user;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    const updated = await this.prisma.user.update({ where: { id }, data: dto });
    const { password: _, ...safe } = updated;
    return safe;
  }

  async findAll(skip = 0, take = 20) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { isActive: true },
        skip, take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, role: true, isActive: true, createdAt: true, updatedAt: true, deletedAt: true,
        },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);
    return { data, total, skip, take };
  }
}
