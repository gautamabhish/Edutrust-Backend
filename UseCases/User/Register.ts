import { User,Role } from "../../entities/User";
import { IUserRepository } from "../../IReps/IUserRepo";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import otpGenerator from "otp-generator";
import { sendOTPEmail } from "../../utils/mail-config";

export class RegisterUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(name: string, email: string, password: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new Error("User already exists");

    const hashed = await bcrypt.hash(password, 10);
    let otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    const user = new User(uuid(), name, email, hashed, otp, otpExpires);
    await this.userRepo.create(user);
    await sendOTPEmail({ email, otp });
    return { message: "User registered successfully" };
  }
}
