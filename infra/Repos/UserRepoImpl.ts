import { PrismaClient } from "@prisma/client";
import { User ,Role} from "../../domain/entity/User";
import { IUserRepository as UserRepository } from "../../domain/Repos/IUserRepo";
import { Prisma_Role } from "../../generated/prisma";

export class UserRepositoryImpl implements UserRepository {
  constructor(private prisma: PrismaClient) {}

    private mapRole(role:Role):Prisma_Role{
        switch (role){
            case Role.Default :
                return Prisma_Role.Default
               
            case Role.Admin:
                return Prisma_Role.Admin
            case Role.SuperAdmin:
                return Prisma_Role.SuperAdmin
            default:
                return Prisma_Role.Default
        }
       
    } 
    private mapRolePrisma(role:Prisma_Role):Role{
        switch (role){
            case Prisma_Role.Default :
                return Role.Default
               
            case Prisma_Role.Admin:
                return Role.Admin
            case Prisma_Role.SuperAdmin:
                return Role.SuperAdmin
            default:
                return Role.Default
        }
       
    }   

  async create(user: User): Promise<void> {
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

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({ where: { email } });
    if (!userData) return null;
    return new User(
      userData.id,
      userData.name,
      userData.email,
      userData.createdAt,
      this.mapRolePrisma(userData.role),
      userData.password
    );
  }

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({ where: { id } });
    if (!userData) return null;
    return new User(
      userData.id,
      userData.name,
      userData.email,
      userData.createdAt,
      this.mapRolePrisma( userData.role),
      userData.password
    );
  }
}
