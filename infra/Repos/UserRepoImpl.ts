import { PrismaClient  } from "../../generated/prisma";
import { User, Role } from "../../domain/entity/User";
import { IUserRepository as UserRepository } from "../../domain/Repos/IUserRepo";
import { Prisma_Role } from "../../generated/prisma";
export class UserRepositoryImpl implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  // Map domain role to Prisma role
  private mapRole(role: Role): Prisma_Role {
    switch (role) {
      case Role.Admin:
        return Prisma_Role.Admin;
      case Role.SuperAdmin:
        return Prisma_Role.SuperAdmin;
      case Role.Default:
      default:
        return Prisma_Role.Default;
    }
  }

  // Map Prisma role to domain role
  private mapRolePrisma(role: Prisma_Role): Role {
    switch (role) {
      case Prisma_Role.Admin:
        return Role.Admin;
      case Prisma_Role.SuperAdmin:
        return Role.SuperAdmin;
      case Prisma_Role.Default:
      default:
        return Role.Default;
    }
  }

  // Register a new user
  async register(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.getPassword(),
        createdAt: user.createdAt,
        role: this.mapRole(user.role),
      },
    });
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return new User(
      user.id,
      user.name,
      user.email,
      user.password,
      user.createdAt,
      this.mapRolePrisma(user.role)
    );
  }

  // Find user by ID
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return new User(
      user.id,
      user.name,
      user.email,
      user.password,
      user.createdAt,
      this.mapRolePrisma(user.role)
    );
  }

  // Update user password
  async updatePassword(id: string, newPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: newPassword },
    });
  }
}
