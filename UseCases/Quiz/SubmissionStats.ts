import { IQuizRepository } from "../../IReps/IQuizRepo";

export class getSubmissionStats {
  constructor(private quizRepo: IQuizRepository) {}

  async execute(attemptId: string,userId: string) {
    const quiz = await this.quizRepo.getSubmissionStats(attemptId,userId);
    if (!quiz) throw new Error("no valid attempt with this id");
    return quiz;
  }
}
