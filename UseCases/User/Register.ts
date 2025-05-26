import { User,Role } from "../../entities/User";
import { IUserRepository } from "../../IReps/IUserRepo";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";

export class RegisterUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(name: string, email: string, password: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new Error("User already exists");

    const hashed = await bcrypt.hash(password, 10);
    const user = new User(uuid(), name, email, hashed);
    await this.userRepo.create(user);
    return { message: "User registered successfully" };
  }
}
