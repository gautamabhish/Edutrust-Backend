import { User } from "../entities/User";
// dtos/CertificateDTO.ts
export interface CertificateDTO {
  id: string;
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
  verified : Boolean;
  creatorName: string;

}


export interface CreateOrderInput {
  userId: string;
  quizId: string;
  referralToken?: string | null;
}

export interface VerifyPaymentInput {
  userId: string;
  quizId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  referralToken?: string | null;
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

  getExplore(): Promise<any>; // returns an array of trending quizzes

  getOrCreateReferralToken(quizId: string, referrerId: string): Promise<string>;
  createOrder(input: CreateOrderInput): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    quizTitle: string;
    referralApplied: boolean;
  }>;

  /**
   * 2) After the frontend obtains a payment and sends back razorpay IDs + signature,
   *    verify the payment, lock in the purchase, and create Referral if applicable.
   */
  verifyPaymentAndProcessReferral(
    input: VerifyPaymentInput
  ): Promise<{ success: boolean; message: string }>;


  getCertificateById(
    certificateId: string):Promise<any> ; 

  getUserQuizzes(userId: string): Promise<CourseDTO[]>;
  getReferrals(userId: string): Promise<any>; // returns an array of users referred by the given user
  getCreations(userId: string): Promise<any>; // returns an array of courses created by the user
  updateProfilePic(userId: string, imageUrl: string): Promise<void>;
  getProfilePic(userId: string): Promise<string | null>;
}
