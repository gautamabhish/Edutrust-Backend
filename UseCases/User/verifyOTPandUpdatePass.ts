import bcrypt from "bcrypt";
import { IUserRepository } from "../../IReps/IUserRepo";

export class VerifyOTPandUpdatePass {
  constructor(private userRepo: IUserRepository) {}

  async execute(email: string, otp: string, newPassword: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (!existing) throw new Error("User not found");

    // 🛡️ OTP + Expiry checks
    console.log(otp,"-",existing.otp);
    if (existing.otp !== otp) throw new Error("Invalid OTP");
    if (!existing.otpExpires || existing.otpExpires < new Date()) throw new Error("OTP expired");

    // 🧠 Check that OTP was intended for forgot password flow
    console.log("OTP Purpose:", existing.otpPurpose);
    if (existing.otpPurpose !== "forgot-password") {
      throw new Error("OTP not intended for password reset");
    }


    // ✅ All checks passed — update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    existing.password = hashedPassword;
    // 🔐 Clear OTP-related fields
    existing.otp = null;
    existing.otpExpires = null;
    existing.otpPurpose = null;

    await this.userRepo.updatePassword(email, existing.password,otp);
    return { message: "Password updated successfully" };
  }
}
