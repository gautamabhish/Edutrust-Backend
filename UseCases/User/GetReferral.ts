import { IUserRepository } from "../../IReps/IUserRepo";

interface InputDTO {
  quizId: string;
  userId: string;
  // baseUrl: string; // e.g., https://yourapp.com
}

export class GetReferralIdUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute({ quizId, userId }: InputDTO): Promise<string> {
    const token = await this.userRepo.getOrCreateReferralToken(quizId, userId);
    return token;
  }
}
