
import { IUserRepository } from "../../IReps/IUserRepo";


export class getCreations {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId:string) {
    const creations = await this.userRepo.getCreations(userId);
    return creations;
  }
}
