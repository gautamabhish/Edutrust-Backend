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
    userQuizzes: CourseDTO[];
    profilePic: string | null;
  }> {
    const [stats, certificates, recommendedQuizzes,userQuizzes,profilePic] = await Promise.all([
      this.userRepo.getUserStats(userId),
      // this.userRepo.getUserQuizzes(userId),
      this.userRepo.getUserCertificates(userId),
      this.userRepo.getRecommendedCourses(userId),
      this.userRepo.getUserQuizzes(userId),
      this.userRepo.getProfilePic(userId)
    ]);
    console.log("User Stats:", profilePic);
    return {
      profilePic,
      stats,
      certificates,
      recommendedQuizzes,
      userQuizzes

    };
  }
}
