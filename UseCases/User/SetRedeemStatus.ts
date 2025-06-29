import { IUserRepository } from "../../IReps/IUserRepo";
import { sendSettlementReceivedEmail } from "../../utils/mail-config-Referral";

export class SetRedeemStatus {
  constructor(private userRepo: IUserRepository) {}

  async execute(referralId: string): Promise<{ message: string }> {
    if (!referralId) {
      throw new Error("Invalid referral ID.");
    }

    // Set redeemed = true and get updated referral data for email
    const updatedReferral = await this.userRepo.setRedeemStatus(referralId);
    if (!updatedReferral) {
      throw new Error("Failed to update redeem status or referral not found.");
    }

    // Send confirmation email
    await sendSettlementReceivedEmail({
      email: updatedReferral.referrerEmail,    // Make sure repo returns this
      referralId: updatedReferral.id,
      // earnedAmount: updatedReferral.earnedAmount,
    });

    return { message: "Redeem status updated and confirmation email sent." };
  }
}
