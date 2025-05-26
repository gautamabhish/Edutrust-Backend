import { v4 as uuidv4 } from "uuid";
import { Referral } from "../../domain/entity/Referal";
import { IReferralRepo } from "../../domain/Repos/IReferralRepo";
export class ReferralUseCase {
  constructor(private referralRepo: IReferralRepo) {}

  /**
   * Create a new referral record.
   * @param referrerId ID of the user who referred
   * @param referredUserId ID of the user who was referred (optional)
   * @param quizId ID of the quiz for which referral was made
   * @returns void
   */
  async addReferral(
    referrerId: string,
    referredUserId: string | null,
    quizId: string
  ): Promise<void> {
    const referral = new Referral(
      uuidv4(),
      referrerId,
      referredUserId,
      quizId,
      0, // initial earnedAmount is zero
      new Date()
    );
    await this.referralRepo.create(referral);
  }

  /**
   * Increase the earned amount for a referral.
   * @param referralId ID of the referral record
   * @param amount Amount to add to the earnedAmount
   */
  async addEarnedAmount(referralId: string, amount: number): Promise<void> {
    const referral = await this.referralRepo.findById(referralId);
    if (!referral) {
      throw new Error("Referral not found");
    }

    const newAmount = referral.earnedAmount + amount;
    await this.referralRepo.updateEarnedAmount(referralId, newAmount);
  }

  /**
   * Get all referrals made by a user.
   * @param referrerId ID of the referrer user
   * @returns Referral[]
   */
  async getReferralsByUser(referrerId: string): Promise<Referral[]> {
    return await this.referralRepo.findByReferrerId(referrerId);
  }
}
