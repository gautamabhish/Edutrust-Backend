import { User, Role } from "../../domain/entity/User";
import { IUserRepository as UserRepository } from "../../domain/Repos/IUserRepo";
import { v4 as uuid } from "uuid";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SALT:string = process.env.JWT_SALT|| "default_jwt_salt"; // Default value for JWT salt if not set in env
if (!JWT_SALT) {

  throw new Error("JWT_SALT is not set in environment variables");
}

export class AuthService {
  constructor(private userRepo: UserRepository) {}

  // Registration Logic
  async register(name: string, email: string, password: string) {
    email = email.trim().toLowerCase();
    if (!name || !email || !password) throw new Error("All fields are required");

    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User(
      uuid(),
      name,
      email,
      hashedPassword,
      new Date(),
      Role.Default,
      [], [], [], [], [], [], []
    );

    await this.userRepo.register(newUser);
    return { message: "User registered successfully!" };
  }

  // Sign-In Logic
  async signIn(email: string, password: string) {
    email = email.trim().toLowerCase();
    if (!email || !password) throw new Error("Email and password are required");

    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new Error("Invalid email or password");

    const passwordMatch = await bcrypt.compare(password, user.getPassword());
    if (!passwordMatch) throw new Error("Invalid email or password");

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SALT,
      { expiresIn: "1h" }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token
    };
  }
}
