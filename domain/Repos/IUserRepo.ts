import { User } from "../entity/User";

export interface IUserRepository {
  register(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updatePassword(id: string, newPassword: string): Promise<void>
}
