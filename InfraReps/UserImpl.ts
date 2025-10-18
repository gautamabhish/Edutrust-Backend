// infra/repositories/UserRepositoryImpl.ts
import {  Prisma_Role, PrismaClient } from "../generated/prisma";
import { User,Role } from "../entities/User";
import { IUserRepository, UserWithCreatorProfile } from "../IReps/IUserRepo";
import { CertificateDTO,CourseDTO } from "../IReps/IUserRepo";
import { CreateOrderInput,VerifyPaymentInput } from "../IReps/IUserRepo";
import Razorpay from "razorpay";
import crypto from "crypto";
import { sendProfileUpdateEmail } from "../utils/mail-config-updateProfile";

// Instantiate Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.KEYID!,
  key_secret: process.env.RAZOR_KEYSEC!,
});
let exploreCache: { data: any; expiresAt: number } | null = null;

// Helper: get cached data if valid
function getExploreCache(): any | null {
  if (!exploreCache) return null;
  if (Date.now() > exploreCache.expiresAt) {
    exploreCache = null; // Expired
    return null;
  }
  return exploreCache.data;
}

// Helper: set cache with TTL
function setExploreCache(data: any, ttlMs: number) {
  exploreCache = {
    data,
    expiresAt: Date.now() + ttlMs,
  };
}

// Commission rate = 15%
const REFERRAL_COMMISSION_RATE = 0.10;
const REFERRAL_DISCOUNT_RATE = 0.20; // 15% discount for referral
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
      this.fromPrismaRole(userData.role),
      userData.otpPurpose || "register",
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

async getExplore(cursor: string|null): Promise<{ data: any[]; nextCursor: string | null }> {
  // 1️⃣ Return cache only for first page
  if (!cursor) {
    const cached = getExploreCache();
    if (cached) return cached;
  }

  // 2️⃣ Fetch from DB with optional cursor
  const quizzes = await this.prisma.quiz.findMany({
    where: { visibleToPublic: true },
    take: 16, // fetch 1 extra to check if there's more
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: { createdAt: 'desc' }, // required for stable pagination
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

  // 3️⃣ Determine if more data exists
  const hasMore = quizzes.length > 15;
  const pageData = quizzes.slice(0, 15); // remove the extra item

  const result = pageData.map((quiz) => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    thumbnailURL: quiz.thumbnailURL ?? '',
    price: quiz.price,
    duration: quiz.duration,
    quizTags: quiz.quizTags.map((qt) => qt.tag.name),
    verified: quiz.verified ?? false,
    creatorName: quiz.creator?.name ?? 'Unknown',
    creatorProfilePic: quiz.creator?.profilePic ?? null,
  }));

  // 4️⃣ Set cache only for first page
  if (!cursor) {
    setExploreCache({ data: result, nextCursor: hasMore ? pageData[14].id : null }, 60 * 60 * 1000);
  }

  // 5️⃣ Return paginated response
  return {
    data: result,
    nextCursor: hasMore ? pageData[14].id : null,
  };
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
    finalAmount = referralApplied
      ? quiz.price * (1 - REFERRAL_DISCOUNT_RATE) // Apply 15% discount
      : quiz.price; 
    

    // 4️⃣ Handle free quiz (finalAmount zero)
    if (finalAmount === 0) {
      await this.prisma.quizAttempt.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          quizId,
          totalScore: 0, 
          attemptNumber:0,
          status: "ABANDONED",
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
          totalScore:0,
          attemptNumber:0,
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
          && !tokenRecord.expired
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
            const newCounter = tokenRecord.counter + 1;
            await tx.referralToken.update({
              where: { token: referralToken },
              data: { counter: {increment:1},expired : newCounter >= 20 }, // Expire after 5 uses
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

  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { role: true ,creatorVerified: true},
  });
  if(user?.role !== Prisma_Role.Creator) {
    throw new Error("User is not a creator");
  }
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
      creatorVerified:user.creatorVerified,
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

async updateOtp(
  email: string,
  otp: string,
  otpExpires: Date,
  otpPurpose: string
): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');

    await tx.user.update({
      where: { email },
      data: {
        otp,
        otpExpires,
        otpPurpose,
      },
    });
  });
}

async updatePassword(email: string,  newPassword: string,otp:string): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { email },
      data: {
        password: newPassword,
        otp: null,
        otpExpires: null,
        otpPurpose: "register",
      },
    });
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

async findByIdWithCreatorProfile(userId: string): Promise<UserWithCreatorProfile | null> {
  return this.prisma.$transaction(async (tx) => {
    const userWithCreatorProfile = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        creatorVerified: true,
        creatorProfile: {
          select: {
            phoneNumber: true,
            expertise: true,
            bio: true,
            experiencePoint1: true,
            experiencePoint2: true,
            experiencePoint3: true,
            experiencePoint4: true,
            experiencePoint5: true,
            telegramLink: true,
            instagramLink: true,
            linkedinLink: true,
            portfolioLink: true,
            status: true,
          },
        },
      },
    });

    if (!userWithCreatorProfile) return null;

    const rawProfile = userWithCreatorProfile.creatorProfile;

    const creatorProfile = rawProfile
      ? {
          phoneNumber: rawProfile.phoneNumber,
          expertise: rawProfile.expertise,
          bio: rawProfile.bio,
          experiencePoints: [
            rawProfile.experiencePoint1,
            rawProfile.experiencePoint2,
            rawProfile.experiencePoint3,
            rawProfile.experiencePoint4,
            rawProfile.experiencePoint5,
          ].filter(Boolean) as string[],
          telegramLink: rawProfile.telegramLink || undefined,
          instagramLink: rawProfile.instagramLink || undefined,
          linkedinLink: rawProfile.linkedinLink || undefined,
          portfolioLink: rawProfile.portfolioLink || undefined,
          status: rawProfile.status.toString(),
        }
      : undefined;

    return {
      id: userWithCreatorProfile.id,
      name: userWithCreatorProfile.name,
      email: userWithCreatorProfile.email,
      profilePic: userWithCreatorProfile.profilePic,
      creatorVerified: userWithCreatorProfile.creatorVerified,
      creatorProfile,
    };
  });
}

async updateProfile(
  userId: string,
  profileData: {
    name?: string;
    email?: string;
    profilePic?: string | null;
    phoneNumber?: string;
    expertise?: string;
    bio?: string;
    experiencePoints?: string[];
    telegramLink?: string;
    instagramLink?: string;
    linkedinLink?: string;
    portfolioLink?: string;
  }
): Promise<void> {
  const sanitizedData = {
    name: profileData.name?.trim(),
    email: profileData.email?.trim(),
    profilePic: profileData.profilePic ?? null,
    phoneNumber: profileData.phoneNumber?.trim() ?? null,
    expertise: profileData.expertise?.trim() ?? null,
    bio: profileData.bio?.trim() ?? null,
    experiencePoints: profileData.experiencePoints
      ?.map((pt) => pt?.trim())
      .filter(Boolean) ?? [],
    telegramLink: profileData.telegramLink?.trim() ?? null,
    instagramLink: profileData.instagramLink?.trim() ?? null,
    linkedinLink: profileData.linkedinLink?.trim() ?? null,
    portfolioLink: profileData.portfolioLink?.trim() ?? null,
  };

  await this.prisma.user.update({
    where: { id: userId },
    data: {
      ...(sanitizedData.name && { name: sanitizedData.name }),
      ...(sanitizedData.email && { email: sanitizedData.email }),
      ...(sanitizedData.profilePic && { profilePic: sanitizedData.profilePic }),

      creatorProfile: {
        upsert: {
          create: {
            phoneNumber: sanitizedData.phoneNumber!,
            expertise: sanitizedData.expertise!,
            bio: sanitizedData.bio!,
            experiencePoint1: sanitizedData.experiencePoints[0] ?? null,
            experiencePoint2: sanitizedData.experiencePoints[1] ?? null,
            experiencePoint3: sanitizedData.experiencePoints[2] ?? null,
            experiencePoint4: sanitizedData.experiencePoints[3] ?? null,
            experiencePoint5: sanitizedData.experiencePoints[4] ?? null,
            telegramLink: sanitizedData.telegramLink,
            instagramLink: sanitizedData.instagramLink,
            linkedinLink: sanitizedData.linkedinLink,
            portfolioLink: sanitizedData.portfolioLink,
            status: "PENDING", // Default status
          },
          update: {
            ...(sanitizedData.phoneNumber && { phoneNumber: sanitizedData.phoneNumber }),
            ...(sanitizedData.expertise && { expertise: sanitizedData.expertise }),
            ...(sanitizedData.bio && { bio: sanitizedData.bio }),
            experiencePoint1: sanitizedData.experiencePoints[0] ?? null,
            experiencePoint2: sanitizedData.experiencePoints[1] ?? null,
            experiencePoint3: sanitizedData.experiencePoints[2] ?? null,
            experiencePoint4: sanitizedData.experiencePoints[3] ?? null,
            experiencePoint5: sanitizedData.experiencePoints[4] ?? null,
            telegramLink: sanitizedData.telegramLink,
            instagramLink: sanitizedData.instagramLink,
            linkedinLink: sanitizedData.linkedinLink,
            portfolioLink: sanitizedData.portfolioLink,
          },
        },
      },
    },
  });
}

async startInterviewSession(userId: string, role: string, resumeText: string): Promise<any> {
  // 1) Validate user
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, TokenLeft: true, role: true },
  });
  if (!user) throw new Error("User not found");
  // Optional role-based guard (if you need)
  // if (user.role !== Prisma_Role.Default) throw new Error("Only normal users can start interviews");

  // 2) Ensure user has enough tokens to start (you said 2000 free tokens)
  if ((user.TokenLeft || 0) < 500) {
    const err: any = new Error("Insufficient tokens to start an interview session. Please purchase tokens.");
    err.status = 403;
    throw err;
  }

  // Reserve tokens for the session — atomic transaction
  const sessionId = crypto.randomUUID();
  const toReserve = Math.min(2000, Math.max(500, user.TokenLeft || 0)); // reserve between 500-2000 tokens
  const [session] = await this.prisma.$transaction([
    this.prisma.interviewSession.create({
      data: {
        id: sessionId,
        userId,
        role,
        // store resumeText if you added that column; otherwise remove field
        // resumeText: resumeText ?? "", 
        startedAt: new Date(),
        timeLimitMinutes: 30,
        status: "STARTED",
        RemaingToken: toReserve,
      },
    }),
    this.prisma.user.update({
      where: { id: userId },
      data: {
        TokenLeft: { decrement: toReserve },
      },
    }),
  ]);

  return {
    sessionId: session.id,
    sessionRemainingTokens: toReserve,
    userTokenLeft: Math.max(0, (user.TokenLeft || 0) - toReserve),
  };
}
async submitInterviewSessionQuestionAnswer(
  userId: string,
  sessionId: string,
  tokenUsage: number,
  satisfactionRating: number , 
  endNext : boolean
): Promise<any> {
  const session = await this.prisma.interviewSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.userId !== userId) {
    throw new Error("Interview session not found or unauthorized");
  }

  // If session is already finished
  if (["COMPLETED", "ABANDONED", "TIMED_OUT"].includes(session.status)) {
    throw new Error("Cannot update a finished session");
  }

  // Time limit check — if exceeded, end session immediately
  const elapsedMinutes = (Date.now() - session.startedAt.getTime()) / 60000;
  if (elapsedMinutes >= session.timeLimitMinutes) {
    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: "TIMED_OUT", finishedAt: new Date()  },
    });
    throw new Error("Session time limit exceeded. Session ended.");
  }

  // Deduct tokens only if session is still active
  const remainingTokens =  session.RemaingToken - tokenUsage;

  // Update satisfaction score (running average)
  let newSatisfaction = satisfactionRating;
  if (session.satisfactionScore != null) {
    newSatisfaction = (session.satisfactionScore + satisfactionRating) / 2;
  }

  const updated = await this.prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      RemaingToken: remainingTokens,
      satisfactionScore: newSatisfaction,
      status:`${endNext?"COMPLETED":"STARTED"}`
    },
  });

  return {
    newRemainingTokens: updated.RemaingToken,
    satisfactionScore: updated.satisfactionScore || 0,
  };
}

  async createInterviewOrder({
    userId,
   
  }: {
    userId: string;
  
  }): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new Error("User not found");

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(99 * 100), // convert to paise
      currency: "INR",
      receipt: `STUDIO CHIPS-${Date.now()}-20,000`,
      notes: { userId, originalAmount: 99 },
    });

    return {
      orderId: order.id,
      amount: 99,
      currency: order.currency,
      razorpayOrderResponse: order,
    };
  }

  /**
   * Verify Razorpay payment and top up user's tokens.
   */
  async purchaseTokensVerify({
    userId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }: {
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    tokensPurchased: number; // tokens to add after payment
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // Verify signature
    const bodyToSign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZOR_KEYSEC!)
      .update(bodyToSign)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      throw new Error("Invalid payment signature");
    }

    // Fetch payment and ensure it's captured
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (!payment || payment.status !== "captured") {
      throw new Error("Payment is not captured");
    }

    // Normalize amount
    const rawAmount = payment.amount;
    const numericAmount = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;
    const amountInRupees = numericAmount / 100; // paise -> rupees

    // Persist payment and update user tokens in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.interviewPayment.create({
        data: {
          userId,
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          amount: amountInRupees,
          currency: payment.currency,
          paidAt: new Date(),
          settled: false,
        },
      });

      // Add tokens to user account
      await tx.user.update({
        where: { id: userId },
        data: {
          TokenLeft: { increment: 20000 },
        },
      });
    });

    return {
      success: true,
      message: `Payment verified. User tokens incremented by ${20000}`,
      newTokenBalance: user.TokenLeft + 20000,
    };
  }

/**
 * End session
 */
async endInterviewSession(sessionId: string) {
  await this.prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      finishedAt: new Date(),
      status: "COMPLETED",
    },
  });
}

async getInterviewTokensLeft(userId: string): Promise<number> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { TokenLeft: true },
  });
  return user?.TokenLeft || 0;
}

}