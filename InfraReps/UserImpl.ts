// infra/repositories/UserRepositoryImpl.ts
import { PrismaClient, Prisma_Role } from "../generated/prisma";
import { User,Role } from "../entities/User";
import { IUserRepository } from "../IReps/IUserRepo";
export class UserRepositoryImpl implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  private toPrismaRole(role: Role): Prisma_Role {
    return Prisma_Role[role];
  }

  private fromPrismaRole(role: Prisma_Role): Role {
    return Role[role];
  }

  async create(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.getPassword(),
        role: this.toPrismaRole(user.role),
        createdAt: user.createdAt
      }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({ where: { email } });
    if (!userData) return null;
    return new User(
      userData.id,
      userData.name,
      userData.email,
      userData.password,
      userData.createdAt,
      this.fromPrismaRole(userData.role)
    );
  }

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({ where: { id } });
    if (!userData) return null;
    return new User(
      userData.id,
      userData.name,
      userData.email,
      userData.password,
      userData.createdAt,
      this.fromPrismaRole(userData.role)
    );
  }
}
