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

editRating(quizId: string, userId: string, rating: number): Promise<any>; // returns Quiz data or null if not found
findByIdPaid(quizId: string , userId:string): Promise<any>; // returns Quiz data or null if not found
getSubmissionStats(attemptId: string ,userId : string,tx?:Prisma.TransactionClient): Promise<any>;
findByTag(tag: string): Promise<any[]>; // returns Quiz data or null if not found
getQuizByTitle(quizTitle:string): Promise<CourseDTO[]>; // returns Quiz data or null if not found
addComment(quizId: string, userId: string, comment: string): Promise<any>; // returns Quiz data or null if not found
}
