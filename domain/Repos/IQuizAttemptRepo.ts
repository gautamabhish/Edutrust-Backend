import { QuizAttempt } from "../entity/QuizAttempt";
export interface IQuizAttemptRepo {
  create(quizAttempt: QuizAttempt): Promise<void>;
  update(quizAttempt: QuizAttempt): Promise<void>;
  findById(id: string): Promise<QuizAttempt | null>;
  findByUserId(userId: string): Promise<QuizAttempt[]>;
}
