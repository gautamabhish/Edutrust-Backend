import { CreateQuizInput } from "../entities/Quiz";

export interface IQuizRepository {
  createQuiz(data: CreateQuizInput): Promise<string>; // returns Quiz ID
  
findById(quizId: string): Promise<any>; // returns Quiz data or null if not found

submitAttempt(data: {
  userId: string;
  quizId: string;
  answers: {
    questionId: string;
    selectedOptions?: number[];
    answerText?: string;
  }[];
  startedAt: Date;
  finishedAt?: Date;
}): Promise<{ score: number; certificateIssued: boolean }>;

}
