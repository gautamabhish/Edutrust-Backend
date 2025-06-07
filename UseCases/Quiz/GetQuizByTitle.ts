import { IQuizRepository } from "../../IReps/IQuizRepo";
export class GetQuizByTitle {
  constructor(private quizRepo: IQuizRepository) {}

  async execute(quizTitle: string) {
    const quiz = await this.quizRepo.getQuizByTitle(quizTitle);
    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  }
}