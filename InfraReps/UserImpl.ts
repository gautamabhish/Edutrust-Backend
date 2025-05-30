// infra/repositories/UserRepositoryImpl.ts
import { PrismaClient, Prisma_Role } from "../generated/prisma";
import { User,Role } from "../entities/User";
import { IUserRepository } from "../IReps/IUserRepo";
import { CertificateDTO  , CourseDTO } from "../IReps/IUserRepo";
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
   async getUserStats(userId: string): Promise<{
    totalPoints: number;
    pointsThisWeek: number;
    totalEarnings: number;
    streak: number;
  }> {
    const now = new Date();
    const last7Days = new Date();
    last7Days.setDate(now.getDate() - 7);

    const quizAttempts = await this.prisma.quizAttempt.findMany({
      where: { userId, score: { not: null } },
    });

    const totalPoints = quizAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0);
    const pointsThisWeek = quizAttempts
      .filter((a) => a.finishedAt && a.finishedAt >= last7Days)
      .reduce((sum, a) => sum + (a.score ?? 0), 0);

    const totalEarnings = await this.prisma.referral.aggregate({
      where: { referrerId: userId },
      _sum: { earnedAmount: true },
    });

    // For now, we fake streak with quiz attempts on different days
    const streak = new Set(
      quizAttempts
        .filter((a) => a.finishedAt)
        .map((a) => (a.finishedAt as Date).toDateString())
    ).size;

    return {
      totalPoints,
      pointsThisWeek,
      totalEarnings: totalEarnings._sum.earnedAmount ?? 0,
      streak,
    };
  }

  async getUserCertificates(userId: string): Promise<CertificateDTO[]> {
    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      include: {
        user: true,
      },
    });

    return certificates.map((cert) => ({
      score: cert.score,
      issuedAt: cert.issuedAt,
      userName: cert.user.name,
    }));
  }

  async getRecommendedCourses(userId: string): Promise<CourseDTO[]> {
    const recommendedQuizzes = await this.prisma.quiz.findMany({
      where: {
        creatorId: { not: userId },
        visibleToPublic: true,
      },
      take: 3,
      select: {
        id: true,
        thumbnailURL: true,
      },
    });

    return recommendedQuizzes.map((quiz) => ({
      id: quiz.id,
      thumbnailURL: quiz.thumbnailURL ?? "",
    }));
  }
}
