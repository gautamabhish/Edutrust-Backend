import { IQuizRepository } from "../../IReps/IQuizRepo";

export class GetQuizByIdPaid {
  constructor(private quizRepo: IQuizRepository) {}

  async execute(quizId: string,userId: string) {
    const quiz = await this.quizRepo.findByIdPaid(quizId,userId);
    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  }
}
