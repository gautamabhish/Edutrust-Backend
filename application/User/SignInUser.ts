import { IUserRepository as UserRepository } from "../../domain/Repos/IUserRepo";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


console.log(process.env);


const JWT_SALT:any = process.env.JWT_SALT  ;

export class SignInUser {
  constructor(private userRepository: UserRepository) {}

  async execute(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");

    const passwordMatch = await bcrypt.compare(password, user.getPassword());
    if (!passwordMatch) throw new Error("Invalid credentials");

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SALT,
      { expiresIn: "1h" } // token valid for 1 hour
    );

    return { user, token };
  }
}
