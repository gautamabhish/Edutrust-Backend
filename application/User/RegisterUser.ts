import { User,Role } from "../../domain/entity/User";
import {IUserRepository as UserRepository} from "../../domain/Repos/IUserRepo"
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt"

export class RegisterUser {
  constructor(private userRepo: UserRepository) {}

  async execute(name: string, email: string, password: string) {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new Error("User already exists");

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User(uuid(), name, email, new Date(), Role.Default, hashed);
    await this.userRepo.create(newUser);
    return { message: "User registered successfully!" };
  }
}
