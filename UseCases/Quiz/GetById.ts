import { IQuizRepository } from "../../IReps/IQuizRepo";

export class GetQuizById {
  constructor(private quizRepo: IQuizRepository) {}

  async execute(quizId: string) {
    const quiz = await this.quizRepo.findById(quizId);
    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  }
}
