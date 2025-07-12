import { IUserRepository } from "../../IReps/IUserRepo";

import { sendOTPEmail } from "../../utils/mail-config-otp";

export class ForgotPassword {
  constructor(private userRepo: IUserRepository) {}

  async execute(email: string): Promise<{ message: string }> {
    if (!email) {
      throw new Error("Email is required");
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate a new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Update the user with the new OTP and expiration
    await this.userRepo.updateOtp(email, otp, otpExpires ,"forgot-password");

    // Send the OTP to the user's email
    await sendOTPEmail({ email, otp });

    return { message: "OTP sent successfully to your email" };
  }
}