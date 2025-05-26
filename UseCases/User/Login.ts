// app/usecases/user/LoginUser.ts
import { IUserRepository } from "../../IReps/IUserRepo";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"; // make sure to store this securely

export class LoginUser {
  constructor(private userRepo: IUserRepository) {}

  async execute(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(password, user.getPassword());
    if (!match) throw new Error("Invalid credentials");

    const payload = { id: user.id, role: user.role, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    return { user: { id: user.id, email: user.email, name: user.name }, token };
  }
}
