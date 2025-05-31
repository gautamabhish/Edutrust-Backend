import { User } from "../entities/User";
// dtos/CertificateDTO.ts
export interface CertificateDTO {
  score: number;
  issuedAt: Date;
  userName: string;
}
export interface CourseDTO {
  id: string;
  title: string;
  description: string;
  thumbnailURL: string;
  price: number;
  duration: number;

    creatorName: string;
  
}

export interface IUserRepository {
  create(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  getUserStats(userId: string): Promise<{
  totalPoints: number;
  pointsThisWeek: number;
  totalEarnings: number;
  streak: number;
}>;

getUserCertificates(userId: string): Promise<CertificateDTO[]>;

getRecommendedCourses(userId: string): Promise<CourseDTO[]>;

getExplore(): Promise<CourseDTO[]>; // returns an array of trending quizzes

}
