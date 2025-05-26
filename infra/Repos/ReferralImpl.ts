import { PrismaClient } from "../../generated/prisma";
import { IReferralRepo } from "../../domain/Repos/IReferralRepo";
import { Referral } from "../../domain/entity/Referal";
export class ReferralRepositoryImpl implements IReferralRepo {
  constructor(private prisma: PrismaClient) {}

  async create(referral: Referral): Promise<void> {
    await this.prisma.referral.create({
      data: {
        id: referral.id,
        referrerId: referral.referrerId,
        referredUserId: referral.referredUserId,
        quizId: referral.quizId,
        earnedAmount: referral.earnedAmount,
        createdAt: referral.createdAt,
      },
    });
  }

  async findById(id: string): Promise<Referral | null> {
    const result = await this.prisma.referral.findUnique({
      where: { id },
      include: {
        referrer: true,
        referredUser: true,
        quiz: true,
      },
    });

    if (!result) return null;

    return new Referral(
      result.id,
      result.referrerId,
      result.referredUserId,
      result.quizId,
      result.earnedAmount,
      result.createdAt,
      result.referrer,
      result.referredUser,
      result.quiz
    );
  }

  async findByReferrerId(referrerId: string): Promise<Referral[]> {
    const results = await this.prisma.referral.findMany({
      where: { referrerId },
      include: {
        referrer: true,
        referredUser: true,
        quiz: true,
      },
    });

    return results.map(
      (r) =>
        new Referral(
          r.id,
          r.referrerId,
          r.referredUserId,
          r.quizId,
          r.earnedAmount,
          r.createdAt,
          r.referrer,
          r.referredUser,
          r.quiz
        )
    );
  }

  async updateEarnedAmount(id: string, amount: number): Promise<void> {
    await this.prisma.referral.update({
      where: { id },
      data: { earnedAmount: amount },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.referral.delete({ where: { id } });
  }
}
