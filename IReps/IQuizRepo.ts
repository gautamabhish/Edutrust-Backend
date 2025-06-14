import { CreateQuizInput } from "../entities/Quiz";
import { Prisma } from "../generated/prisma";
import { CourseDTO } from "./IUserRepo";
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
}): Promise<any>;

findByIdPaid(quizId: string , userId:string): Promise<any>; // returns Quiz data or null if not found
getSubmissionStats(attemptId: string ,userId : string,tx?:Prisma.TransactionClient): Promise<any>;
getQuizByTitle(quizTitle:string): Promise<CourseDTO[]>; // returns Quiz data or null if not found
}
