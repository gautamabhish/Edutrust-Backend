import { IQuizAttemptRepo } from "../../domain/Repos/IQuizAttemptRepo";
import {v4 as uuidv4} from "uuid";
import { QuizAttempt } from "../../domain/entity/QuizAttempt";
export class QuizAttemptUseCase {
  constructor(private quizAttemptRepo: IQuizAttemptRepo) {}

  async startAttempt(userId: string, quizId: string): Promise<QuizAttempt> {
    const newAttempt = new QuizAttempt(
      uuidv4(),
      userId,
      quizId,
      null,
      new Date(),
      null
    );
    await this.quizAttemptRepo.create(newAttempt);
    return newAttempt;
  }

  async finishAttempt(attemptId: string, score: number): Promise<void> {
    const attempt = await this.quizAttemptRepo.findById(attemptId);
    if (!attempt) throw new Error("Attempt not found");

    attempt.score = score;
    attempt.finishedAt = new Date();

    await this.quizAttemptRepo.update(attempt);
  }

  async getAttemptsForUser(userId: string): Promise<QuizAttempt[]> {
    return this.quizAttemptRepo.findByUserId(userId);
  }
}
