import { IQuizRepository } from "../../IReps/IQuizRepo";

export class SubmitQuizAttempt {
  constructor(private quizRepo: IQuizRepository) {}

  async execute(data: {
    userId: string;
    quizId: string;
    answers: {
      questionId: string;
      selectedOptions?: number[];
      answerText?: string;
    }[];
    startedAt: Date;
    finishedAt?: Date;
  }) {
    return this.quizRepo.submitAttempt(data);
  }
}
