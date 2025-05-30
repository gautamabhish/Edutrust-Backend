import { IUserRepository } from "../../IReps/IUserRepo";
import { CertificateDTO, CourseDTO } from "../../IReps/IUserRepo";

export class GetUserDashboard {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string): Promise<{
    stats: {
      totalPoints: number;
      pointsThisWeek: number;
      totalEarnings: number;
      streak: number;
    };
    certificates: CertificateDTO[];
    recommendedQuizzes: CourseDTO[];
  }> {
    const [stats, certificates, recommendedQuizzes] = await Promise.all([
      this.userRepo.getUserStats(userId),
      this.userRepo.getUserCertificates(userId),
      this.userRepo.getRecommendedCourses(userId),
    ]);

    return {
      stats,
      certificates,
      recommendedQuizzes,
    };
  }
}
