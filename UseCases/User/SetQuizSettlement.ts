import { IUserRepository } from "../../IReps/IUserRepo";
import { sendSettlementReceivedEmailForQuiz } from "../../utils/mail-config-quizSettlement";

export class SetQuizSettlementRequest {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string): Promise<{ message: string; count: number; amount: number }> {
    if (!userId) throw new Error("Invalid user ID.");

    // 1️⃣ Verify user exists
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("User not found. Cannot process settlement request.");
    }

    // 2️⃣ Update payments + get total settled amount
    const { updatedCount,totalAmount} = await this.userRepo.setQuizPaymentsRedeemRequestedandGetAmount(userId);
    if (updatedCount === 0) {
      throw new Error("No eligible quiz payments found to request settlement.");
    }

    // 3️⃣ Send confirmation email
    try {
      await sendSettlementReceivedEmailForQuiz({
        email: user.email,
        name: user.name || "User", // Fallback to "User" if name is not set
        amount: totalAmount*0.65, // Assuming 65% of the total amount is settled
        requestedAt: new Date(),
      });
    } catch (err) {
      console.error("Settlement email failed to send:", err);
      // Optionally: throw error or proceed
    }

    return {
      message: `${updatedCount} settlement request(s) submitted for ₹${totalAmount}.`,
      count: updatedCount,
      amount: totalAmount,
    };
  }
}
