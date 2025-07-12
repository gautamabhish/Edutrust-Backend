import { IUserRepository } from "../../IReps/IUserRepo";

export class VerifyOTP {
  constructor(private userRepo: IUserRepository) {}

  async execute(email: string, otp: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (!existing) throw new Error("User not found");

    if (existing.isVerified) throw new Error("User already verified");
    if (existing.otp !== otp) throw new Error("Invalid OTP");
    if (!existing.otpExpires || existing.otpExpires < new Date()) throw new Error("OTP expired");

    // ✅ Check that OTP purpose is for registration
    if (existing.otpPurpose !== "register") {
      throw new Error("OTP not intended for registration");
    }

    //  Mark user as verified and clear OTP
    existing.isVerified = true;
    existing.otp = null;
    existing.otpExpires = null;
    existing.otpPurpose = null;

    await this.userRepo.update(existing);
    
    return { message: "User registered successfully" };
  }
}
