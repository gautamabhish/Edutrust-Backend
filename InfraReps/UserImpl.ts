// infra/repositories/UserRepositoryImpl.ts
import {  Prisma_Role, PrismaClient } from "../generated/prisma";
import { User,Role } from "../entities/User";
import { IUserRepository } from "../IReps/IUserRepo";
import { CertificateDTO,CourseDTO } from "../IReps/IUserRepo";
import { CreateOrderInput,VerifyPaymentInput } from "../IReps/IUserRepo";
import Razorpay from "razorpay";
import crypto from "crypto";



// Instantiate Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.KEYID!,
  key_secret: process.env.RAZOR_KEYSEC!,
});

// Commission rate = 15%
const REFERRAL_COMMISSION_RATE = 0.15;
export class UserRepositoryImpl implements IUserRepository {
  constructor(private prisma: PrismaClient) {}
  async update(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: user.isVerified,
        otp: user.otp,
        otpExpires: user.otpExpires,

        createdAt: user.createdAt,
      },
    });
  }

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
        otp:user.otp,
        otpExpires: user.otpExpires,
        password: user.getPassword(),
        role: this.toPrismaRole(user.role),
        createdAt: user.createdAt
      }
    });
  }
  async delete(userId: string): Promise<void> {
     await this.prisma.$transaction(async (tx) => {

      // Delete the user itself
      await tx.user.delete({
        where: { id: userId ,isVerified: false},

      });

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
      userData.otp||"",
      userData.otpExpires|| new Date(0), // Default to 10 minutes from now
      userData.isVerified,
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
      id : cert.id,
      issuedAt: cert.issuedAt,
      userName: cert.user.name,
      score: cert.score,
    }));
  }
  async getProfilePic(userId: string): Promise<string|null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profilePic: true },
    });
    return user?.profilePic || null;
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
        title: true,
        description: true,
        verified: true, // Assuming verified is a boolean field
        price: true,
        duration: true,
        thumbnailURL: true,
        creatorName:true, // Assuming creatorName is a field in the quiz model
      },
    });

    return recommendedQuizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title, 
      description: quiz.description,
      price: quiz.price,
      duration: quiz.duration,
      verified: quiz.verified ?? false, // Assuming verified is a boolean field
      thumbnailURL: quiz.thumbnailURL ?? "",
      creatorName: quiz.creatorName ?? "", // Assuming creatorName is a field in the quiz model
    }));
  }

async getExplore(): Promise<any> {
  const quizzes = await this.prisma.quiz.findMany({
    where: { visibleToPublic: true },
    take: 10,
    select: {
      id: true,
      title: true,
      description: true,
      thumbnailURL: true,
      price: true,
      duration: true,
      verified: true,
      quizTags: {
        select: {
          tag: { select: { name: true } },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          profilePic: true,
        },
      },
    },
  });

  return quizzes.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    thumbnailURL: quiz.thumbnailURL ?? "",
    price: quiz.price,
    duration: quiz.duration,
    quizTags: quiz.quizTags.map((qt) => qt.tag.name),
    verified: quiz.verified ?? false,
    creatorName: quiz.creator?.name ?? "Unknown",
    creatorProfilePic: quiz.creator?.profilePic ?? null,
  }));
}

async getOrCreateReferralToken(quizId: string, referrerId: string): Promise<string> {
  try {
    // Ensure quiz exists
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId }
    });
    if (!quiz) throw new Error("Quiz not found");

    // Ensure user exists
    const user = await this.prisma.user.findUnique({
      where: { id: referrerId }
    });
    if (!user) throw new Error("Referrer user not found");

    // Check for existing token
    const existing = await this.prisma.referralToken.findFirst({
      where: { quizId, referrerId }
    });
    if (existing) {
      return `https://www.skillpass.org/explore/${quizId}?ref=${existing.token}`;
    }

    // Create new token
    const newToken = await this.prisma.referralToken.create({
      data: { quizId, referrerId }
    });

    return `https://www.skillpass.org/explore/${quizId}?ref=${newToken.token}`;
  } catch (err:any) {
    console.error("Referral token generation failed", err);
    throw new Error(err.message || "Could not generate referral link");
  }
}

async createOrder({
  userId,
  quizId,
  referralToken = null,
}: CreateOrderInput): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  quizTitle: string;
  referralApplied: boolean;
}> {
  try {
    // 1️⃣ Check if already purchased / attempted
    const attempt = await this.prisma.quizAttempt.findFirst({
      where: { userId, quizId },
    });
    if (attempt) {
      throw new Error("This quiz is already purchased or attempted by the user.");
    }

    // 2️⃣ Fetch quiz details
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, title: true, price: true, currency: true },
    });
    if (!quiz) {
      throw new Error("Quiz not found.");
    }

    let finalAmount = quiz.price;
    let referralApplied = false;

    // 3️⃣ Check referral token validity and apply discount if valid
    if (referralToken) {
      const tokenRecord = await this.prisma.referralToken.findUnique({
        where: { token: referralToken  , expired:false },
      });

      if (
        tokenRecord &&
        tokenRecord.quizId === quizId &&
        tokenRecord.referrerId !== userId
      ) {
        referralApplied = true;
      }
    }

    // 4️⃣ Handle free quiz (finalAmount zero)
    if (finalAmount === 0) {
      await this.prisma.quizAttempt.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          quizId,
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });

      return {
        orderId: "IFITISFREE",
        amount: 0,
        currency: quiz.currency || "INR",
        quizTitle: quiz.title,
        referralApplied,
      };
    }

    // 5️⃣ Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // paise
      currency: (quiz.currency?.toUpperCase() || "INR"),
      receipt: `QUIZ-is purchasing`,
      notes: {
        userId,
        quizId,
        referralToken: referralToken || "",
        originalAmount: quiz.price,
        finalAmount,
      },
    });

    return {
      orderId: order.id,
      amount: finalAmount,
      currency: order.currency,
      quizTitle: quiz.title,
      referralApplied,
    };
  } catch (error) {
    console.error("Error in createOrder:", error);
    // Optionally rethrow or return a custom error object
    throw new Error(
      error instanceof Error ? error.message : "An unexpected error occurred."
    );
  }
}


  /**
   * 2) After the front-end completes checkout, it sends back:
   *      { userId, quizId, razorpayOrderId, razorpayPaymentId, razorpaySignature, referralToken? }
   *    We:
   *      a) Verify the HMAC signature
   *      b) Fetch the Razorpay payment and ensure status === 'captured'
   *      c) Insert a QuizAttempt row (unlock the quiz for user)
   *      d) If referralToken is valid, insert a Referral row with 20% of price
   */
  async verifyPaymentAndProcessReferral({
    userId,
    quizId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    referralToken = null,
  }: VerifyPaymentInput): Promise<{ success: boolean; message: string }> {
    // 1) Verify Razorpay signature
    const bodyToSign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_KEYSEC!)
      .update(bodyToSign)
      .digest("hex");
    if (expectedSignature !== razorpaySignature) {
      throw new Error("Invalid payment signature");
    }

    // 2) Fetch the payment from Razorpay to ensure it was captured
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (payment.status !== "captured") {
      throw new Error("Payment was not captured");
    }

    // 3) Guard: ensure we haven’t already recorded a purchase for this user+quiz
    const alreadyAttempted = await this.prisma.quizAttempt.findFirst({
      where: { userId, quizId },
    });
    if (alreadyAttempted) {
      throw new Error("This quiz is already purchased or attempted by the user.");
    }

     const rawAmount = payment.amount;
  const numericAmount =
    typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;
  const amountInRupees = numericAmount / 100; // now it’s a number


    // 4) In a transaction: create QuizAttempt & (if valid) create Referral
    await this.prisma.$transaction(async (tx) => {
      // 4a) Mark that user now owns/attempts this quiz
      await tx.quizAttempt.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          quizId,
          startedAt: new Date(),
          finishedAt: new Date(), // Assuming instant unlock
        },
      });

      await tx.quizPayment.create({
  data: {
    userId,
    quizId,
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    amount: amountInRupees,
    currency: payment.currency,
    redeemRequest: false, // Default
    settled: false,  // Default
  },
});


      // 4b) If referralToken was provided and still valid, create a Referral record
      if (referralToken) {
        const tokenRecord = await tx.referralToken.findUnique({
          where: { token: referralToken },
        });
        if (
          tokenRecord &&
          tokenRecord.quizId === quizId &&
          tokenRecord.referrerId !== userId
        ) {
          // Ensure this user hasn't already been referred for this quiz
          const existingReferral = await tx.referral.findFirst({
            where: { referredUserId: userId, quizId },
          });
          if (!existingReferral) {
            // Commission = 20% of (payment amount in rupees)
            const commissionAmount =amountInRupees * REFERRAL_COMMISSION_RATE;
            await tx.referral.create({
              data: {
                referrerId: tokenRecord.referrerId,
                referredUserId: userId,
                quizId,
                earnedAmount: commissionAmount,
                redeemed: false,
              },
            });
          }
        }
      }
    });

    return {
      success: true,
      message: "Payment verified, quiz unlocked, and referral credited (if any).",
    };
  }

  async setQuizPaymentsRedeemRequestedandGetAmount(
    userId: string
  ): Promise<any> {
    // 1) Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new Error("User not found. Cannot process settlement request.");
    }

    // 2) Update all eligible QuizPayments to redeemRequested = true
    const updatedPayments = await this.prisma.quizPayment.updateMany({
      where: {
        quiz: { creatorId: userId }, // Only payments for quizzes created by this user
        redeemRequest: false, // Only update those not already requested
        settled: false, // Only those not settled yet
      },
      data: { redeemRequest: true },
    });
    // console.log("Updated payments count:", updatedPayments);
    if (updatedPayments.count === 0) {
      throw new Error("No eligible quiz payments found to request settlement.");
    }

    // 3) Calculate total amount requested for settlement
    const totalAmount = await this.prisma.quizPayment.aggregate({
      where: {
        quiz: { creatorId: userId }, // Only payments for quizzes created by this user
        redeemRequest: true, // Only those requested
        settled: false,
      },
      _sum: { amount: true },
    });

    return {
      updatedCount: updatedPayments.count,
      totalAmount: (totalAmount._sum.amount || 0)*0.65, // Handle case where no payments
      
    };
  } 

async getReferrals(userId: string): Promise<any> {
  const referrals = await this.prisma.referral.findMany({
    where: { referrerId: userId },
    select: {
      id : true,
      earnedAmount: true,
      createdAt: true,
      redeemed: true,
      quiz: {
        select: {
          title: true
        }
      },
      referredUser: {
        select: {
          name: true
        }
      },
      settledDate: true, // Include settledDate if needed
    }
  });

  return referrals.map(referral => ( 
    {
      id : referral.id,
      quizTitle: referral.quiz.title,
      referredUserName: referral.referredUser?.name|| "Unknown User",
      earnedAmount: referral.earnedAmount,
      createdAt: referral.createdAt,    
      settledAt: referral.settledDate || null, // Handle settledDate if it exists
      redeemed : referral.redeemed,
    }
  ));
    }


async getCertificateById(certificateId: string): Promise<any> {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: true, // Include user details if needed
      },
    });

    if (!certificate) {
      throw new Error("Certificate not found");
    }
    const user = await  this.findById(certificate.userId);
    if (!user) {
      throw new Error("User not found for this certificate");
    }
  const betterCount = await this.prisma.quizAttempt.count({
    where: {
      quizId: certificate.quizId,
      score: { gt: certificate.score ?? 0 },
    },
  });
  const rank = betterCount + 1;
  const quiz = await this.prisma.quiz.findUnique({
      where: { id: certificate.quizId },
      select: { title: true , creatorName:true }, // Include other fields as necessary
  });
    return {
      id: certificate.id,
      score : certificate.score,
      totalScore: certificate.totalScore,
      userName: user.name, 
      quizTitle: quiz?.title ,
      rank : rank ,
      creatorName : quiz?.creatorName,
      issuedAt: certificate.issuedAt,
      
      // Add other fields as necessary
    };
  }

async getUserQuizzes(userId: string): Promise<CourseDTO[]> {
  const quizzes = await this.prisma.quiz.findMany({
    where: {
      quizAttempts: {
        some: {
          userId: userId,
        },
      },
    },
    select: {
      id: true,
      title: true,
      creatorName: true,
      description: true,
      thumbnailURL: true,
      price: true,
      duration: true,
      verified: true,
    },
  });

  return quizzes.map(quiz => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    thumbnailURL: quiz.thumbnailURL ?? '',
    price: quiz.price,
    duration: quiz.duration,
    verified: quiz.verified ?? false,
    creatorName: quiz.creatorName,
  }));
}


async getCreations(userId: string): Promise<any> {
  return await this.prisma.$transaction(async (tx) => {
    // Step 1: Get all quizzes by user
    const quizzes = await tx.quiz.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        title: true,
        price: true,
      },
    });

    if (quizzes.length === 0) {
      return {
        quizzes: [],
        settlements: []
      };
    }

    // Step 2: Get distinct userIds from QuizAttempt for these quizzes
    const quizIds = quizzes.map((quiz) => quiz.id);

  const payments = await tx.quizPayment.findMany({
  where: {
    quizId: { in: quizIds },
  },
  select: {
    quizId: true,
    userId: true,
  },
});


const paymentMap: Record<string, Set<string>> = {};
for (const pay of payments) {
  if (!paymentMap[pay.quizId]) {
    paymentMap[pay.quizId] = new Set();
  }
  paymentMap[pay.quizId].add(pay.userId);
}

    // Step 4: Get settlement records for this user
 const settlements = await tx.quizPayment.findMany({
  where: {
    quiz: { creatorId: userId },
    redeemRequest: true,
  },
  select: {
    id: true,
    quizId: true,
    amount: true,
    settled: true,
    redeemRequest: true,
    settledAt: true,
  },
});


    // Step 5: Combine data and calculate earnings
    const quizResults = quizzes.map((quiz) => {
      const uniquePurchasers = paymentMap[quiz.id]?.size || 0;
      const earnings = quiz.price * 0.65 * uniquePurchasers; // Assuming 65% share

      return {
        id: quiz.id,
        title: quiz.title,
        price: quiz.price,
        purchases: uniquePurchasers,
        earnings,
      };
    });

    // Final return
    return {
      quizzes: quizResults,
      settlements: settlements.map(s => ({
        id: s.id,
        quizId: s.quizId,
        amount: s.amount*0.65,   
        redeemed: s.redeemRequest,
        settled: s.settled,
        settledAt: s.settledAt ? s.settledAt.toISOString() : null, // Format date if needed
       

      })),
    };
  });
}



async updateProfilePic(userId: string, imageUrl: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { profilePic: imageUrl },
    });
  }


async setRedeemStatus(referralId: string) {
  return await this.prisma.referral.update({
    where: { id: referralId },
    data: {
      redeemed: true,
      // settledDate: new Date(),
    },
    select: {
      id: true,
      earnedAmount: true,
      referrer: {
        select: { email: true },
      },
    },
  }).then((r:any)=> ({
    id: r.id,
    earnedAmount: r.earnedAmount,
    referrerEmail: r.referrer.email,
  })).catch(() => null);
}


}