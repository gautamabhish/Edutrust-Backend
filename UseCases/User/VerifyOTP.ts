import { User } from "../../entities/User";
import { IUserRepository } from "../../IReps/IUserRepo";

export class VerifyOTP {
  constructor(private userRepo: IUserRepository) {}

  async execute( email: string, otp: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (!existing) throw new Error("User Not Found");
    // console.log("Verifying OTP for email:", email);
    if(existing.isVerified) throw new Error("User already verified");
    // console.log("Verifying OTP for user:", otp);
    // console.log("User details:", existing);
  //  console.log(typeof existing.otp, typeof otp);
   if(existing.otp !== otp) throw new Error("Invalid OTP");
    if (existing.otpExpires < new Date()) throw new Error("OTP expired");
    // Update user to mark as verified
    existing.isVerified = true;
    existing.otp = ""; // Clear OTP after verification
    existing.otpExpires = new Date(); // Clear OTP expiration date
    await this.userRepo.update(existing);
    
    return { message: "User registered successfully" };
  }
}
